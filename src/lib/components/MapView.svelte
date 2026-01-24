<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import MapCanvas from "$lib/components/MapCanvas.svelte";
  import { infoOpen } from "$lib/constants/ui";
  import Backdrop from "$lib/components/Backdrop.svelte";
  import ErrorNotification from "$lib/components/ErrorNotification.svelte";
  import { getAmenities, getPointToPoi } from "$lib/services/isochrone-service";
  import {
    getHeatmapPois,
    type HeatmapPoi,
  } from "$lib/services/heatmap-service";
  import type {
    TransportMode,
    Location,
    HeatmapState,
    UIState,
    MapState,
    POIState,
  } from "$lib/types/map";

  let mapCanvasComponent: MapCanvas | undefined;

  // UI State
  let ui: UIState = {
    sidebarOpen: true,
    selectingLocation: false,
    isInitialLoading: true,
    isIsochroneLoading: false,
  };

  // Transport & Location
  let mode: TransportMode = "walk";
  let location: Location = {
    selected: false,
    lat: null,
    lng: null,
  };

  // Map References
  let mapState: MapState = {
    L: null,
    instance: null,
    userMarker: null,
  };

  // POI Data
  let pois: POIState = {
    markers: [],
    area: null,
    count: 0,
    abortController: null,
  };

  // Current POI data to pass to MapCanvas
  let poiData: { amenities: any[]; polygon: any } | null = null;

  // Heatmap
  let heatmap: HeatmapState = {
    L: null,
    map: null,
    pois: [],
    loading: false,
    error: null,
  };

  let notificationComponent: ErrorNotification;

  /**
   * Load heatmap data on mount
   */
  onMount(async () => {
    ui.isInitialLoading = true;
    heatmap.loading = true;
    heatmap.error = null;

    try {
      heatmap.pois = await getHeatmapPois();
      console.log("[heatmap_pois] loaded:", heatmap.pois.length);
    } catch (e) {
      console.error("[heatmap_pois] failed:", e);
      heatmap.error = e instanceof Error ? e.message : String(e);
    } finally {
      heatmap.loading = false;
      ui.isInitialLoading = false;
    }
  });

  /**
   * Handle map ready event - store L and map references
   */
  function handleMapReady(event: { L: any; map: any }) {
    mapState.L = event.L;
    mapState.instance = event.map;
    heatmap.L = event.L;
    heatmap.map = event.map;
    console.log("[MapView] Map ready");
  }

  /**
   * Handle transport mode selection
   */
  async function handleModeSelect(event: { mode: string }) {
    mode = event.mode as TransportMode;

    // Only redraw if user already picked a location
    if (location.lat && location.lng) {
      ui.sidebarOpen = false;
      await fetchAndRenderPOIs(location.lat, location.lng, mode);
      ui.sidebarOpen = true;
    }
  }

  /**
   * Handle location selected on map
   */
  async function handleLocationSelected(event: { lat: number; lng: number }) {
    const { lat, lng } = event;

    location.lat = lat;
    location.lng = lng;
    location.selected = false;

    ui.selectingLocation = false;

    await fetchAndRenderPOIs(lat, lng, mode);

    ui.sidebarOpen = true;
  }

  /**
   * Handle location requested from browser geolocation
   */
  async function handleLocationRequested(event: { lat: number; lng: number }) {
    const { lat, lng } = event;

    location.lat = lat;
    location.lng = lng;
    location.selected = false;

    await fetchAndRenderPOIs(lat, lng, "walk");

    ui.sidebarOpen = true;
  }

  /**
   * Handle select location button
   */
  function handleSelectLocation() {
    ui.selectingLocation = true;
    ui.sidebarOpen = false;
  }

  /**
   * Handle clear selection
   */
  function handleClear() {
    location.selected = false;
    location.lat = null;
    location.lng = null;
    pois.count = 0;
    poiData = null;
  }

  /**
   * Handle cancel location selection
   */
  function handleCancelSelection() {
    ui.selectingLocation = false;
  }

  /**
   * Handle search result selection
   */
  async function handleSearchSelect(event: {
    lat: number;
    lng: number;
    name: string;
  }) {
    const { lat, lng, name } = event;

    // Check map component
    if (!mapCanvasComponent) {
      console.warn("Map component not ready yet");
      return;
    }

    // Check boundary before processing
    if (!mapCanvasComponent.checkBoundary(lat, lng)) {
      mapCanvasComponent.showBoundaryError();
      return; // Stop here - don't update location or fetch POIs
    }

    // If within boundary, proceed normally
    location.lat = lat;
    location.lng = lng;
    location.selected = false;

    await fetchAndRenderPOIs(lat, lng, mode);
    ui.sidebarOpen = true;
  }

  /**
   * Handle error from MapCanvas
   */
  function handleError(event: { message: string }) {
    alert(event.message);
  }

  /**
   * Fetch POI data from API and update map
   */
  async function fetchAndRenderPOIs(
    lat: number,
    lng: number,
    transportMode: TransportMode,
  ) {
    try {
      // Abort previous request if any
      if (pois.abortController) {
        pois.abortController.abort();
      }
      pois.abortController = new AbortController();

      ui.isIsochroneLoading = true;

      const predefined_amanities = await getAmenities();

      const data = await getPointToPoi(
        lng,
        lat,
        transportMode,
        900,
        predefined_amanities,
        pois.abortController.signal,
      );
      pois.abortController = null;

      console.log("Point-to-poi response: ", data);

      // Update POI data for MapCanvas
      poiData = {
        amenities: data.amenities || [],
        polygon: data.polygon,
      };

      pois.count = data.amenities?.length || 0;
      location.selected = true;

      ui.isIsochroneLoading = false;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("Request aborted");
        return;
      }
      console.error(err);
      notificationComponent.addNotification(
        "The backend server is not responding.",
      );
      ui.isIsochroneLoading = false;
    }
  }

  /**
   * Abort ongoing POI fetch
   */
  function handleAbortPoi() {
    if (pois.abortController) {
      pois.abortController.abort();
      pois.abortController = null;
    }
    ui.isIsochroneLoading = false;
  }

  /**
   * Information window
   */
  let open = false;

  const close = () => (open = false);
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  // image paths (recommended: put images into /static/images/...)
  import heroImg from "$lib/assets/location_description.png";
  const heatmapImg = "/images/heatmap-example.png";
  const poiImg = "/images/poi-example.png";
</script>

<div class="relative h-screen">
  <!-- ============================================
	     NAVIGATION
	     ============================================ -->

  <!-- Top Navigation Bar -->
  <nav
    class="fixed top-0 left-0 w-full bg-white shadow z-[1005] h-14 flex items-center px-4"
  >
    <!-- Hamburger Button -->
    <button
      class="text-2xl p-2 rounded hover:bg-gray-100"
      on:click={() => (ui.sidebarOpen = !ui.sidebarOpen)}
    >
      ☰
    </button>

    <!-- App Title -->
    <div class="ml-4 text-xl font-semibold text-gray-700">15-Minute City</div>

    <!-- App Title -->
    <div class="ml-4 text-xl font-semibold text-gray-700">15-Minute City</div>

    <button
      class="absolute right-3 text-xl p-2 rounded hover:bg-gray-100"
      on:click={() => infoOpen.set(true)}
      aria-label="Information"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
    </button>

    {#if $infoOpen}
      <!-- Overlay -->
      <div
        class="fixed inset-0 z-[20000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        tabindex="0"
        on:click|self={() => infoOpen.set(false)}
        on:keydown={(e) => e.key === "Escape" && infoOpen.set(false)}
      >
        <!-- Modal -->
        <div
          class="w-[min(900px,92vw)] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden
             animate-in fade-in zoom-in-95 duration-200"
          on:click|stopPropagation={() => {}}
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                15-Minute City
              </h2>
              <p class="text-sm text-gray-600">
                How the app works and what you can do
              </p>
            </div>
            <button
              class="h-9 w-9 grid place-items-center rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Close"
              on:click={() => infoOpen.set(false)}
            >
              ✕
            </button>
          </div>

          <!-- Scrollable Content -->
          <div class="px-6 py-5 overflow-y-auto max-h-[calc(85vh-72px)]">
            <!-- Hero section -->
            <section class="space-y-3">
              <h3 class="text-base font-semibold text-gray-900">Overview</h3>
              <p class="text-sm leading-6 text-gray-700">
                This application visualizes urban accessibility through the
                15-minute city concept. Select any location in Münster and see
                which amenities are reachable within a chosen travel time and
                transport mode.
              </p>

              <img
                src={heroImg}
                alt="15-minute city overview screenshot"
                class="w-3/4 max-w-sm mx-auto rounded-xl border border-black/10"
                loading="lazy"
              />
              <p class="text-xs text-gray-500">
                Locations can be selected by 1. selecting your own location or
                2. selecting a location manually.
              </p>
            </section>

            <div class="my-6 border-t" />

            <!-- Features grid -->
            <section class="space-y-4">
              <h3 class="text-base font-semibold text-gray-900">
                Key Features
              </h3>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl border border-black/10 p-4">
                  <h4 class="text-sm font-semibold text-gray-900">
                    Isochrone Map
                  </h4>
                  <p class="mt-1 text-sm text-gray-700 leading-6">
                    Generates an area polygon showing what you can reach within
                    the chosen time.
                  </p>
                  <img
                    src={poiImg}
                    alt="Isochrone polygon example"
                    class="mt-3 w-full rounded-lg border border-black/10"
                    loading="lazy"
                  />
                </div>

                <div class="rounded-xl border border-black/10 p-4">
                  <h4 class="text-sm font-semibold text-gray-900">
                    Amenity Heatmap
                  </h4>
                  <p class="mt-1 text-sm text-gray-700 leading-6">
                    Highlights clusters of amenities to quickly compare
                    different areas.
                  </p>
                  <img
                    src={heatmapImg}
                    alt="Heatmap example"
                    class="mt-3 w-full rounded-lg border border-black/10"
                    loading="lazy"
                  />
                </div>
              </div>
            </section>

            <div class="my-6 border-t" />

            <!-- How to use -->
            <section class="space-y-3">
              <h3 class="text-base font-semibold text-gray-900">How to use</h3>
              <ol class="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                <li>Select a transport mode (walk / bike / car).</li>
                <li>Click on the map to choose a starting point.</li>
                <li>
                  View reachable amenities and the score for that location.
                </li>
                <li>
                  Toggle the heatmap to compare amenity density across Münster.
                </li>
              </ol>
            </section>

            <div class="my-6 border-t" />

            <!-- Footer note -->
            <section class="text-xs text-gray-500">
              <p>
                Data sources: OpenStreetMap (POIs), routing/isochrones provided
                by the backend service.
              </p>
            </section>
          </div>
        </div>
      </div>
    {/if}
  </nav>

  <!-- ============================================
	     MAIN CONTENT
	     ============================================ -->

  <!-- Sidebar -->
  <Sidebar
    bind:open={ui.sidebarOpen}
    {mode}
    {location}
    {heatmap}
    amenities={poiData?.amenities || []}
    onModeSelect={handleModeSelect}
    onSelectLocation={handleSelectLocation}
    onSearchSelect={handleSearchSelect}
    onClearSelection={handleClear}
  />

  <!-- Map Canvas -->
  <MapCanvas
    bind:this={mapCanvasComponent}
    {mode}
    {location}
    {poiData}
    selectingLocation={ui.selectingLocation}
    onMapReady={handleMapReady}
    onLocationSelected={handleLocationSelected}
    onLocationRequested={handleLocationRequested}
    onCancelSelection={handleCancelSelection}
    onError={handleError}
  />

  <!-- ============================================
	     LOADING STATES
	     ============================================ -->

  <!-- Initial Loading Screen -->
  <Backdrop show={ui.isInitialLoading} variant="dark" zIndex={9999}>
    <div
      class="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4"
    >
      <div class="animate-spin">
        <svg
          class="w-12 h-12 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <p class="text-lg font-semibold text-gray-700">Loading map and data...</p>
    </div>
  </Backdrop>

  <!-- Transport Mode Loading -->
  <Backdrop
    show={ui.isIsochroneLoading}
    variant="blur"
    zIndex={10500}
    closeable={true}
    onClose={handleAbortPoi}
  >
    <div
      class="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3"
      style="width: min(360px, 90vw); border: 1px solid rgba(147, 197, 253, 0.5); padding-right: 32px;"
    >
      <div style="position: relative; width: 96px; height: 96px">
        <span
          style="
						position: absolute;
						inset: 0;
						border-radius: 9999px;
						border: 3px solid transparent;
						border-top-color: #2563eb;
						border-right-color: #93c5fd;
						animation: iso-spin 1.35s linear infinite;
						display: block;
					"
        ></span>
        <span
          style="
						position: absolute;
						inset: 12px;
						border-radius: 9999px;
						border: 3px solid transparent;
						border-top-color: #2563eb;
						border-right-color: #93c5fd;
						opacity: 0.45;
						animation: iso-spin 1.7s linear infinite;
						display: block;
					"
        ></span>
        <span
          style="
						position: absolute;
						width: 18px;
						height: 18px;
						border-radius: 9999px;
						background: #2563eb;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						animation: iso-pulse 1.6s ease-in-out infinite;
						box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.32);
						display: block;
					"
        ></span>
      </div>
      <div class="text-center">
        <p class="font-bold text-gray-900 m-0">Analyzing reachable area...</p>
        <p class="text-gray-600 text-sm m-0 mt-0.5">
          Finding amenities within 15 minutes
        </p>
      </div>
    </div>
  </Backdrop>
</div>

<!-- Error Notifications -->
<ErrorNotification bind:this={notificationComponent} />

<style>
  :global {
    @keyframes iso-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes iso-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.32);
      }
      70% {
        box-shadow: 0 0 0 18px rgba(37, 99, 235, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
      }
    }
  }
</style>
