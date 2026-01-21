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
	import Loading from "$lib/components/Loading.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import Score from "$lib/components/Score.svelte";

	// Types
	type TransportMode = "walk" | "bike" | "car";

	// Constants
	const MARKER_STYLES = {
		radius: 8,
		color: "red",
		weight: 2,
		fillColor: "red",
		fillOpacity: 0.9,
	};

	const ICON_CONFIG = {
		iconSize: [38, 57] as [number, number],
		iconAnchor: [22, 94] as [number, number],
		popupAnchor: [-3, -76] as [number, number],
	};

	// Map References
	let mapDiv!: HTMLDivElement;
	let L: typeof import("leaflet") | null = null;
	let map: import("leaflet").Map | null = null;

	// UI State
	let sidebarOpen = true;
	let selectingLocation = false;
	let isInitialLoading = true;
	let isIsochroneLoading = false;
	let notificationComponent: ErrorNotification;

	// User Location State
	let userLat: number | null = null;
	let userLng: number | null = null;
	let userAccuracy: number | null = null;
	let userMarker: import("leaflet").Layer | null = null;

	// Map Layers State
	let area_oi: import("leaflet").GeoJSON<any> | null = null;
	let poiMarkers: import("leaflet").Marker[] = [];
	let poiAbortController: AbortController | null = null;

	// Data State
	let mode: TransportMode = "walk";
	let amenityCount = 0;
	let locationSelected = false;

	// Heatmap State
	let heatmapPois: HeatmapPoi[] = [];
	let heatmapPoisLoading = false;
	let heatmapPoisError: string | null = null;

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

	/**
	 * Convert amenity names from snake_case to Sentence Case
	 * @param text - The text to convert (e.g., "fast_food")
	 * @returns Sentence cased text (e.g., "Fast Food")
	 */
	function toSentenceCase(text: string): string {
		return text
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	/**
	 * Select appropriate icon for a POI based on its amenity tags
	 * @param poi - The POI object with tags
	 * @param icons - Available icon set
	 * @returns The appropriate icon for the POI
	 */
	function getIconForAmenity(poi: any, icons: { food: any; education: any }): any {
		// Check if educational institute
		if (poi.tags?.amenity === 'school' ||
			poi.tags?.amenity === 'university' ||
			poi.tags?.amenity === 'college' ||
			poi.tags?.amenity === 'kindergarten'
		) {
			return icons.education;
		}
		
		// Default to food icon
		return icons.food;
	}

  // Add selecting-mode classes and listener
  $: if (map && L) {
    const container = map.getContainer();
    if (selectingLocation) {
      container.classList.add('selecting-location');
    } else {
      container.classList.remove('selecting-location');
    }
  }

	/**
	 * Initialize the Leaflet library by dynamically importing it
	 */
	async function initializeLeaflet() {
		const leaflet = await import("$lib/leaflet-client");
		L = leaflet.default as any;
		console.log("[leaflet] typeof heatLayer =", typeof (L as any).heatLayer);
	}

	/**
	 * Create tile layers (OSM, Satellite, Topographic) for the map
	 * @returns Object containing all tile layers
	 */
	function createTileLayers() {
		const osm = L!.tileLayer(
			"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			{ maxZoom: 19, attribution: "© OpenStreetMap contributors" },
		);

		const satellite = L!.tileLayer(
			"https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
			{
				maxZoom: 20,
				subdomains: ["mt0", "mt1", "mt2", "mt3"],
				attribution: "© Google Satellite",
			},
		);

		const topo = L!.tileLayer(
			"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
			{
				maxZoom: 17,
				attribution: "© OpenTopoMap (CC-BY-SA)",
			},
		);

		return { osm, satellite, topo };
	}

	/**
	 * Setup the map instance with layers and controls
	 * @param layers - Tile layers to add to the map
	 */
	function setupMapInstance(layers: any) {
		map = L!.map(mapDiv, {
			center: [51.96, 7.62],
			zoom: 12,
			layers: [layers.osm],
		});

		// Add layer control
		const baseLayers = {
			OpenStreetMap: layers.osm,
			Satellite: layers.satellite,
			Topographic: layers.topo,
		};
		L!.control.layers(baseLayers).addTo(map);

		// Add zoom control to bottom right
		map.zoomControl.setPosition("bottomright");
	}

	/**
	 * Load heatmap data from the API
	 */
	async function loadHeatmapData() {
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
	}

	/**
	 * Register event handlers for map interactions (clicks, location selection)
	 */
	function registerMapEventHandlers() {
		map!.on("click", async (e: any) => {
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
				userMarker = createUserMarker(lat, lng);

				// remove previous markers and area
				if (area_oi) clearMapLayers();
				isIsochroneLoading = true;
				await drawPointToPoi(lat, lng, mode);
				isIsochroneLoading = false;
				sidebarOpen = true;

				selectingLocation = false;
				return;
			}
		});
	}

	// Run once when the component is first added to the page
	onMount(async () => {
		isInitialLoading = true;

		await initializeLeaflet();
		const layers = createTileLayers();
		setupMapInstance(layers);
		await loadHeatmapData();
		registerMapEventHandlers();

		isInitialLoading = false;
	});

	/**
	 * Request user's browser location via Geolocation API
	 */
	async function requestBrowserLocation() {
		if (!L || !map) return;

		if (!("geolocation" in navigator)) {
			alert("Geolocation not supported.");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const { latitude, longitude } = pos.coords;

				userLat = latitude;
				userLng = longitude;

				map!.setView([latitude, longitude], 15);

				// Clear previous selection
				clearPreviousSelection();
				
				// Show loading state
				isIsochroneLoading = true;
				await drawPointToPoi(latitude, longitude, "walk");
				isIsochroneLoading = false;

				// Open sidebar after load
				sidebarOpen = true;
			},
			(err) => {
				console.error(err);
				alert("Could not retrieve location.");
			},
			{ enableHighAccuracy: true },
		);
	}


	/**
	 * Pan the map to the user's saved location
	 */
	function goToMyLocation() {
		if (userLat && userLng && map) {
			map.setView([userLat, userLng], 16, { animate: true });
		} else {
			alert("Location not available yet");
		}
	}

	/**
	 * Create a circular marker at the specified location to represent the user
	 * @param lat - Latitude coordinate
	 * @param lng - Longitude coordinate
	 * @returns The created Leaflet layer
	 */
	function createUserMarker(lat: number, lng: number): import("leaflet").Layer {
		return L!
			.circleMarker([lat, lng], MARKER_STYLES)
			.addTo(map!);
	}

	/**
	 * Clear previous selection by removing user marker and map layers
	 */
	function clearPreviousSelection(): void {
		if (userMarker) map!.removeLayer(userMarker);
		if (area_oi) clearMapLayers();
	}

	/**
	 * Render the isochrone polygon on the map
	 * @param polygonData - GeoJSON polygon data
	 */
	function renderPolygon(polygonData: any): void {
		if (polygonData) {
			area_oi = L!.geoJSON(polygonData).addTo(map!);
		}
	}

	/**
	 * Create icon set for POI markers
	 * @returns Object containing all POI icons
	 */
	function createPoiIcons() {
		return {
			food: L!.icon({
				iconUrl: foodURL,
				...ICON_CONFIG
			}),
			education: L!.icon({
				iconUrl: educationURL,
				...ICON_CONFIG
			})
		};
	}

	/**
	 * Render POI markers on the map for all amenities
	 * @param amenities - Array of amenity objects to render
	 */
	function renderPoiMarkers(amenities: any[]): void {
		if (!amenities?.length) return;

		const icons = createPoiIcons();
		
		amenities.forEach((poi: any) => {
			if (poi.lat && poi.lon) {
				const selectedIcon = getIconForAmenity(poi, icons);
				const amenityLabel = toSentenceCase(poi.amenity);
				const marker = L!
					.marker([poi.lat, poi.lon], { 
						icon: selectedIcon,
						title: amenityLabel
					})
					.addTo(map!)
					.bindPopup(`<b>Category: </b><b>${amenityLabel}</b>`);

				poiMarkers.push(marker);
			}
		});
	}

	/**
	 * Handle errors from POI fetch operations
	 * @param err - The error object
	 */
	function handlePoiError(err: any): void {
		if (err instanceof DOMException && err.name === 'AbortError') {
			console.log("Request aborted");
			return;
		}
		console.error(err);
		notificationComponent.addNotification("The backend server is not responding.");
	}

	/**
	 * Main function to fetch and render POI data for a location
	 * @param latitude - Latitude coordinate
	 * @param longitude - Longitude coordinate
	 * @param mode - Transport mode for isochrone calculation
	 */
	async function drawPointToPoi(
		latitude: number,
		longitude: number,
		mode: TransportMode,
	) {
		try {
			selectingLocation = false;
			clearPreviousSelection();
			userMarker = createUserMarker(latitude, longitude);

			if (poiAbortController) poiAbortController.abort();
			poiAbortController = new AbortController();
			
			const data = await getPointToPoi(longitude, latitude, mode, 900, poiAbortController.signal);
			poiAbortController = null;

			console.log("Point-to-poi response: ", data);

			renderPolygon(data.polygon);
			renderPoiMarkers(data.amenities);

			amenityCount = data.amenities?.length || 0;
			locationSelected = true;
		} catch (err) {
			handlePoiError(err);
		}
	}

	/**
	 * Abort ongoing POI fetch and clean up
	 */
	function abortPointToPoi() {
		// remove previous marker and area
		if (userMarker) map!.removeLayer(userMarker);

		// cancel request
		if (poiAbortController) poiAbortController.abort();
		poiAbortController = null;
	}

	/**
	 * Remove all POI markers and polygon layers from the map
	 */
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

	/**
	 * Clear the current selection and reset all location-related state
	 */
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

	/**
	 * Handle the "New Location" button click - clears current selection and enters selection mode
	 */
	function handleNewLocation() {
		clearSelection();
		selectingLocation = true;
		sidebarOpen = false;
	}

	/**
	 * Handle transport mode selection and re-fetch POI data if location exists
	 * @param selectedMode - The newly selected transport mode
	 */
	async function handleModeSelect(selectedMode: string) {
		mode = selectedMode as TransportMode;

		// Only redraw if user already picked a location
		if (userLat && userLng) {
			// Hide sidebar during loading
			sidebarOpen = false;
			
			// Show loading state
			isIsochroneLoading = true;
			await drawPointToPoi(userLat, userLng, mode);
			isIsochroneLoading = false;

			// Reopen sidebar after loading
			sidebarOpen = true;
		}
	}
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
<Loading 
  show={isIsochroneLoading} 
  onClose={() => abortPointToPoi()} 
/>

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

<style>
  /* Selecting location mode */
  :global(.selecting-location) {
    cursor: crosshair !important;
  }

  :global(.selecting-location.leaflet-container.leaflet-drag-target) {
    cursor: grabbing !important;
  }
</style>

<ErrorNotification bind:this={notificationComponent} />