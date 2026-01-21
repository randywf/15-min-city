<script lang="ts">
	import { onMount } from "svelte";

	import walk from "$lib/assets/walk.svg?raw";
	import bicycle from "$lib/assets/bicycle.svg?raw";
	import car from "$lib/assets/car.svg?raw";
	import bus from "$lib/assets/bus.svg?raw";
	import location from "$lib/assets/location.svg?raw";
	import search from "$lib/assets/search.svg?raw";
	import educationURL from '$lib/assets/education_rainbow.png'
	import foodURL from '$lib/assets/food_Lime.png'
	import ErrorNotification from "$lib/components/ErrorNotification.svelte";
	import { getPointToPoi } from "$lib/services/isochrone-service";
	import { getHeatmapPois, type HeatmapPoi } from "$lib/services/heatmap-service";
	import { AMENITIES, AMENITY_GRADIENTS, type Amenity } from "$lib/constants/amenities";
	import Heatmap from "$lib/components/Heatmap.svelte";
	import Modal from "$lib/components/Modal.svelte";


	let mapDiv!: HTMLDivElement;
	let sidebarOpen = true;
	let mode = "walk";
	let storeMap: any;
	let userLat: number | null = null;
	let userLng: number | null = null;
	let notificationComponent: ErrorNotification;
	let userAccuracy: number | null = null;
	let selectingLocation = false; // select location mode
  let poiAbortController: AbortController | null = null;
	let selectedMarker: any = null; // store last selected location
	let area_oi: import("leaflet").GeoJSON<any> | null = null; // store area of interest layer
	let poiMarkers: any[] = [];

	// Heatmap Variables
	

	let heatmapPois: HeatmapPoi[] = [];
	let heatmapPoisLoading = false;
	let heatmapPoisError: string | null = null;

	// Loading states
	let amenityCount = 0;
	let locationSelected = false;
	let isInitialLoading = true;
	let isIsochroneLoading = false;

	// Leaflet map and library reference (declared here to be accessible in functions)
	let L: typeof import("leaflet") | null = null;
	let map: import("leaflet").Map | null = null;
	let userMarker: import("leaflet").Layer | null = null;

	const transportModes = [
		{
			name: "walk",
			value: "walk",
			icon: walk,
		},
		{
			name: "bike",
			value: "bike",
			icon: bicycle,
		},
		{
			name: "car",
			value: "car",
			icon: car,
		},
		{
			name: "Public Transport",
			value: "public",
			icon: bus,
		},
	];

  // Add selecting-mode classes and listener
  $: if (map && L) {
    const container = map.getContainer();
    if (selectingLocation) {
      container.classList.add('selecting-location');
    } else {
      container.classList.remove('selecting-location');
    }
  }

	// Run once when the component is first added to the page
	onMount(async () => {
		isInitialLoading = true;

		const leaflet = await import("$lib/leaflet-client");
		L = leaflet.default as any;
		console.log("[leaflet] typeof heatLayer =", typeof (L as any).heatLayer);


		const osm = L.tileLayer(
			"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			{ maxZoom: 19, attribution: "© OpenStreetMap contributors" },
		);
		// Satellite Layer
		const satellite = L.tileLayer(
			"https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
			{
				maxZoom: 20,
				subdomains: ["mt0", "mt1", "mt2", "mt3"],
				attribution: "© Google Satellite",
			},
		);
		// Topographic Layer
		const topo = L.tileLayer(
			"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
			{
				maxZoom: 17,
				attribution: "© OpenTopoMap (CC-BY-SA)",
			},
		);

		// Create map using OSM as default
		map = L.map(mapDiv, {
			center: [51.96, 7.62],
			zoom: 12,
			layers: [osm],
		});

		storeMap = map;

		// --- Heatmap init fetch (RUNS ONCE) ---
		heatmapPoisLoading = true;
		heatmapPoisError = null;

		try {
		heatmapPois = await getHeatmapPois();
		console.log("[heatmap_pois] loaded:", heatmapPois.length, heatmapPois);
		} catch (e) {
		console.error("[heatmap_pois] failed:", e);
		heatmapPoisError = e instanceof Error ? e.message : String(e);
		} finally {
		heatmapPoisLoading = false;
		}

		// End Initial loading after heatmap is done
		isInitialLoading = false;


		// New Layer Control
		const baseLayers = {
			OpenStreetMap: osm,
			Satellite: satellite,
			Topographic: topo,
		};
		// Add layer control to map
		L.control.layers(baseLayers).addTo(map);

		// Handle map clicks
		map!.on("click", async (e: L.LeafletMouseEvent) => {
			// Always close sidebar on click
			if (sidebarOpen) sidebarOpen = false;

			// If we are in "select location" mode -> set new user location
			if (selectingLocation) {
				const { lat, lng } = e.latlng;

				userLat = lat;
				userLng = lng;
				userAccuracy = null;

				map!.setView([lat, lng], 15);

				// Remove old selected marker (if any)
				if (userMarker) {
					map!.removeLayer(userMarker);
				}
				userMarker = L!
					.circleMarker([lat, lng], {
						radius: 8,
						color: "red",
						weight: 2,
						fillColor: "red",
						fillOpacity: 0.9,
					})
					.addTo(map!); // add new user marker

				// remove previous markers and area
				if (area_oi) clearMapLayers();
				isIsochroneLoading = true;
				await drawPointToPoi(lat, lng, mode as any); // add the pois in the area
				isIsochroneLoading = false;
				sidebarOpen = true;

				selectingLocation = false;
				return;
			}
		});

		// Add zoom control to bottom right
		map.zoomControl.setPosition("bottomright");

		// Close sidebar on map click
		map.on("click", () => {
			if (sidebarOpen) sidebarOpen = false;
		});
	});

	// called when the button is clicked
	function requestBrowserLocation() {
		if (!L || !map) return;

		if (!("geolocation" in navigator)) {
			alert("Geolocation not supported.");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;

				userLat = latitude;
				userLng = longitude;

				map!.setView([latitude, longitude], 15);

				
				drawPointToPoi(latitude, longitude, "walk"); // add the pois in the area
			},
			(err) => {
				console.error(err);
				alert("Could not retrieve location.");
			},
			{ enableHighAccuracy: true },
		);
	}


	// Go to user location
	function goToMyLocation() {
		if (userLat && userLng) {
			storeMap.setView([userLat, userLng], 16, { animate: true });
		} else {
			alert("Location not available yet");
		}
	}

	// Convert amenity names to Sentence case
	function toSentenceCase(text: string): string {
		return text
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');

	}

	async function drawPointToPoi(
		latitude: number,
		longitude: number,
		mode: "walk" | "bike" | "car",
	) {
		try {
      // remove previous marker and area
      if (userMarker) map!.removeLayer(userMarker);

      // remove previous markers and area
      if (area_oi) clearMapLayers();

      userMarker = L!
        .circleMarker([latitude, longitude], {
          radius: 8,
          color: "red",
          weight: 2,
          fillColor: "red",
          fillOpacity: 0.9,
        })
        .addTo(map!); // add new user marker


      if (poiAbortController) poiAbortController.abort();
      poiAbortController = new AbortController();
			const data = await getPointToPoi(longitude, latitude, mode, 900, poiAbortController.signal);
      poiAbortController = null;

			console.log("Point-to-poi response: ", data);

			// --- Draw polygon ---
			if (data.polygon) {
				area_oi = L!.geoJSON(data.polygon).addTo(map!);
			}

			// Count and display amenities
			amenityCount = 0;

			// --- Add amenities ---
			if (data.amenities?.length) {
				amenityCount = data.amenities.length;

				// Define all amenity icons
				const food = L!.icon({
					iconUrl: foodURL,
					iconSize: [38, 57], // w:h = 1:1.5
					iconAnchor: [22, 94],
					popupAnchor: [-3, -76]
				});

				const education = L!.icon({
					iconUrl: educationURL,
					iconSize: [38, 57], // w:h = 1:1.5
					iconAnchor: [22, 94],
					popupAnchor: [-3, -76]
				});

				data.amenities.forEach((poi: any) => {
					if (poi.lat && poi.lon) {
						const name = poi.tags?.name || "Unnamed location";

						// --- 1. LOGIC TO PICK THE ICON ---
						// Start with a default
						let selectedIcon = food;

						// Check if educational institute
						if (poi.tags?.amenity === 'school' ||
							poi.tags?.amenity === 'university' ||
							poi.tags?.amenity === 'college' ||
							poi.tags?.amenity === 'kindergarten'
						) {
							selectedIcon = education;
						}

						// else if (poi.tags?.leisure === 'park' ||
						// 		poi.tags?.amenity === 'park'
						// 	) {
    				// 			selectedIcon = park;
						// }

                        // Add more 'else if' blocks for other types

						// --- 2. CREATE MARKER WITH SELECTED ICON ---
						const amenityLabel = toSentenceCase(poi.amenity);
						const marker = L!
							.marker([poi.lat, poi.lon], { 
								icon: selectedIcon,
								title: amenityLabel
							})
							.addTo(map!)
							.bindPopup(`<b>Category: </b><b>${amenityLabel}</b>`);

						poiMarkers.push(marker); // if you're storing them to remove later
					}
				});
			}

			locationSelected = true;
		} catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log("Request aborted");
        return;
      }
			console.error(err);
			notificationComponent.addNotification("The backend server is not responding.")
		}
	}

  function abortPointToPoi() {
    // remove previous marker and area
    if (userMarker) map!.removeLayer(userMarker);

    // cancel request
    if (poiAbortController) poiAbortController.abort();
    poiAbortController = null;
  }

	function clearMapLayers() {
		// Remove markers
		poiMarkers.forEach((marker) => map!.removeLayer(marker));
		poiMarkers = [];

		// Remove polygons
		if (area_oi) {
			map!.removeLayer(area_oi);
			area_oi = null;
		}
	}

	function clearSelection() {
		// Clear map layers
		clearMapLayers();

		// Remove user marker
		if (userMarker) {
			map!.removeLayer(userMarker);
			userMarker = null;
		}

		// Reset state
		userLat = null;
		userLng = null;
		locationSelected = false;
		amenityCount = 0;
	}

	function handleNewLocation() {
		clearSelection();
		locationSelected = true;
		sidebarOpen = false;
	}

	async function handleModeSelect(selectedMode: string) {
		mode = selectedMode;

		// Only redraw if user already picked a location
		if (userLat && userLng) {
			if (area_oi) clearMapLayers(); // clear previous layers

            // Hide sidebar during isochrone loading
			sidebarOpen = false;
            isIsochroneLoading = true;
            await drawPointToPoi(userLat, userLng, selectedMode as any);
            isIsochroneLoading = false;

			// Reopen sidebar after loading the isochrone
			sidebarOpen = true;
		}
	}

  import Score from "$lib/components/Score.svelte";


</script>

<!-- INITIAL LOADING SCREEN (component load + heatmap) -->
{#if isInitialLoading}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div class="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
            <div class="animate-spin">
                <svg class="w-12 h-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p class="text-lg font-semibold text-gray-700">Loading map and data...</p>
        </div>
    </div>
{/if}

<!-- Location Status and Actions -->
{#if locationSelected}
<div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
	<div class="flex items-start justify-between mb-2">
	<div class="flex-1">
		<h4 class="text-sm font-semibold text-gray-800">Location Selected</h4>
		<p class="text-xs text-gray-600 mt-1">
		{amenityCount} amenities found in 15 min {mode}
		</p>
	</div>
	<div class="w-3 h-3 bg-blue-500 rounded-full"></div>
	</div>
	
	<div class="flex gap-2 mt-3">
	<button
		class="flex-1 py-2 px-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
		on:click={handleNewLocation}
	>
		<span class="text-base">📍</span>
		New Location
	</button>
	<button
		class="flex-1 py-2 px-3 rounded-lg bg-red-50 border border-red-300 hover:bg-red-100 text-sm font-medium text-red-700 flex items-center justify-center gap-2"
		on:click={clearSelection}
	>
		<span class="text-base">✕</span>
		Clear
	</button>
	</div>
</div>
{:else}
<button
	class="w-full mt-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
	on:click={() => {
	selectingLocation = true;
	sidebarOpen = false;
	}}
>
	Select location on map
</button>
{/if}

<!-- TRANSPORT MODE LOADING SCREEN (when selecting transport mode) -->
{#if isIsochroneLoading}
  <div style="
    position:fixed;inset:0;z-index:10500;display:flex;align-items:center;justify-content:center;
    background:rgba(248,250,252,0.72);backdrop-filter:blur(6px) saturate(120%);
  ">
    <div style="
      width:min(360px,90vw);padding:22px 26px;border-radius:18px;
      background:rgba(255,255,255,0.95);border:1px solid rgba(147,197,253,0.5);
      box-shadow:0 20px 50px rgba(37,99,235,0.12);display:flex;flex-direction:column;
      align-items:center;gap:12px;text-align:center;
    ">
      <div style="position:relative;width:96px;height:96px;">
        <span style="
          position:absolute;inset:0;border-radius:9999px;border:3px solid transparent;
          border-top-color:#2563eb;border-right-color:#93c5fd;
          animation:iso-spin 1.35s linear infinite;
          display:block;
        "></span>
        <span style="
          position:absolute;inset:12px;border-radius:9999px;border:3px solid transparent;
          border-top-color:#2563eb;border-right-color:#93c5fd;opacity:0.45;
          animation:iso-spin 1.7s linear infinite;display:block;
        "></span>
        <span style="
          position:absolute;width:18px;height:18px;border-radius:9999px;background:#2563eb;
          top:50%;left:50%;transform:translate(-50%,-50%);
          animation:iso-pulse 1.6s ease-in-out infinite;
          box-shadow:0 0 0 0 rgba(37,99,235,0.32);display:block;
        "></span>
      </div>
      <div>
        <p style="margin:0;font-weight:700;color:#0f172a;">Analyzing reachable area...</p>
        <p style="margin:2px 0 0;color:#475569;font-size:0.95rem;">Finding amenities within 15 minutes</p>
      </div>
    </div>
  </div>
  <style>
    @keyframes iso-spin { to { transform: rotate(360deg); } }
    @keyframes iso-pulse {
      0% { box-shadow:0 0 0 0 rgba(37,99,235,0.32); }
      70% { box-shadow:0 0 0 18px rgba(37,99,235,0); }
      100% { box-shadow:0 0 0 0 rgba(37,99,235,0); }
    }
  </style>
{/if}

<!--TOP NAVIGATION BAR-->
<div
  class="fixed top-0 left-0 w-full bg-white shadow z-[1005] h-14 flex items-center px-4"
>
  <!--COLLAPSE/EXPAND BUTTON-->
  <button
    class="text-2xl p-2 rounded hover:bg-gray-100"
    on:click={() => (sidebarOpen = !sidebarOpen)}>☰</button
  >

  <!-- App Title -->
  <div class="ml-4 text-xl font-semibold text-gray-700">15-Minute City</div>
</div>

<!--SIDENAV-->
<div
  class="fixed top-14 left-0 h-[calc(100%-3.5rem)] w-[296px] max-w-[400px] min-w-[400px]
       bg-white shadow-xl p-4 transition-transform duration-300 z-[1004]
       overflow-y-auto overflow-x-hidden"
  class:translate-x-[-100%]={!sidebarOpen}
>

  <!-- Search Field -->
  <div class="mt-0">
    <div class="relative mb-4">
      <input
        type="text"
        placeholder="Search place or amenity"
        class="w-full border border-gray-400 rounded-lg py-2 pl-3 pr-10 text-gray-700 shadow-sm"
      />
      <div class="absolute top-1.5 right-2 z-[10000]">
        <button
          class="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-gray-100"
        >
          <span class="w-4 h-4 [&>svg]:w-full [&>svg]:h-full"
            >{@html search}</span
          >
        </button>
      </div>
    </div>
  </div>

  <!-- Transport Modes -->
  <div class="mt-">
    <h1 class="text-sm font-semibold text-gray-900 mb-4">Transport Mode</h1>
    <div class="grid grid-cols-4 gap-2">
      {#each transportModes as t}
        <button
          class="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                 hover:border-blue-400"
          class:bg-blue-500={mode === t.value}
          class:text-white={mode === t.value}
          class:border-blue-500={mode === t.value}
          class:bg-gray-50={mode !== t.value}
          class:text-gray-600={mode !== t.value}
          class:border-gray-200={mode !== t.value}
          on:click={() => handleModeSelect(t.value)}
        >
          <span class="w-6 h-6 mb-1 [&>svg]:w-full [&>svg]:h-full"
            >{@html t.icon}</span>
          <span class="text-xs font-medium capitalize">{t.value}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Select location and Clear buttons -->
  <div class="grid grid-cols-4 gap-2 mt-4 mb-4">
    <button
      class="col-span-3 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
      on:click={() => {
        selectingLocation = true;
        sidebarOpen = false;
      }}
    >
      Select Location on Map
    </button>
    
    <button
      class="col-span-1 py-3 rounded-lg text-sm font-medium transition-all"
      class:bg-red-500={locationSelected && (area_oi || poiMarkers.length > 0)}
      class:text-white={locationSelected && (area_oi || poiMarkers.length > 0)}
      class:hover:bg-red-600={locationSelected && (area_oi || poiMarkers.length > 0)}
      class:bg-gray-200={!(locationSelected && (area_oi || poiMarkers.length > 0))}
      class:text-gray-400={!(locationSelected && (area_oi || poiMarkers.length > 0))}
      class:cursor-not-allowed={!(locationSelected && (area_oi || poiMarkers.length > 0))}
      disabled={!(locationSelected && (area_oi || poiMarkers.length > 0))}
      on:click={clearSelection}
    >
      Clear
    </button>
  </div>

  <!-- Accessibility Score Section -->
  <div class="mt-6">
    <h3 class="text-base font-semibold text-gray-600 mb-4">Accessibility Score</h3>
    <Score {locationSelected} {userLat} {userLng} {mode} />
  </div>

  <Heatmap
  {L}
  {map}
  heatmapPois={heatmapPois}
  loading={heatmapPoisLoading}
  error={heatmapPoisError}
/>
</div>

<!--button to zoom to location-->
<div class="absolute bottom-28 right-3 z-[10000]">
  <button
    class="w-9 h-9 rounded-full bg-white shadow-lg border flex items-center justify-center hover:bg-gray-100"
    on:click={goToMyLocation}
  >
    <span class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full">{@html location}</span>
  </button>
</div>

<!--button get position-->
<div class="absolute bottom-40 right-3 z-[10000]">
  <button
    class="w-9 h-9 rounded-full bg-white shadow-lg border flex items-center justify-center hover:bg-gray-100"
    on:click={requestBrowserLocation}
  >
    📍
  </button>
</div>

<div bind:this={mapDiv} class="absolute inset-0 z-[1] top-14"></div>

<Modal show={selectingLocation} onClose={() => selectingLocation = false}>
  <h2>Selecting location...</h2>
  <p>Close this message to cancel.</p>
</Modal>

<Modal show={poiAbortController !== null} onClose={abortPointToPoi}>
  <div class="flex items-center gap-4">
    <div class="pulse-circle"></div>
    <div class="flex flex-col">
      <h2>Finding nearby amenities...</h2>
      <p>Close this message to cancel.</p>
    </div>
  </div>
</Modal>

<style>
  .controls {
    position: absolute;
    z-index: 1000;
    background: white;
    padding: 8px;
    border-radius: 6px;
    top: 10px;
    left: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  #map {
    height: 100%;
    width: 100%;
  }

  .icon-white :global(svg) {
  stroke: white !important;
  fill: white !important;
  color: white !important;
  }

  /* Selecting location mode */
  :global(.selecting-location) {
    cursor: crosshair !important;
  }

  :global(.selecting-location.leaflet-container.leaflet-drag-target) {
    cursor: grabbing !important;
  }

  /* Pulsing circle animation */
  .pulse-circle {
    width: 40px;
    height: 40px;
    background-color: #3b82f6;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.5;
    }
  }
</style>

<ErrorNotification bind:this={notificationComponent} />