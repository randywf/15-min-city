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
	import { getPointToPoi } from "$lib/services/isochrone-service";
	import { getHeatmapPois, type HeatmapPoi } from "$lib/services/heatmap-service";
	import { AMENITIES, AMENITY_GRADIENTS, type Amenity } from "$lib/constants/amenities";
	import Heatmap from "$lib/components/Heatmap.svelte";


	let mapDiv!: HTMLDivElement;
	let sidebarOpen = false;
	let mode = "walking";
	let storeMap: any;
	let userLat: number | null = null;
	let userLng: number | null = null;
	let userAccuracy: number | null = null;
	let selectingLocation = false; // select location mode
	let selectedMarker: any = null; // store last selected location
	let area_oi: import("leaflet").GeoJSON<any> | null = null; // store area of interest layer
	let poiMarkers: any[] = [];

	// Heatmap Variables
	

	let heatmapPois: HeatmapPoi[] = [];
	let heatmapPoisLoading = false;
	let heatmapPoisError: string | null = null;


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
				drawPointToPoi(lat, lng, "walk"); // add the pois in the area

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

				// remove previous marker and area
				if (userMarker) map!.removeLayer(userMarker);
				userMarker = L!
					.circleMarker([latitude, longitude], {
						radius: 8,
						color: "red",
						weight: 2,
						fillColor: "red",
						fillOpacity: 0.9,
					})
					.addTo(map!); // add new user marker

				// remove previous markers and area
				if (area_oi) clearMapLayers();
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

	async function drawPointToPoi(
		latitude: number,
		longitude: number,
		mode: "walk" | "bike" | "car",
	) {
		try {
			const data = await getPointToPoi(longitude, latitude, mode, 900);

			console.log("Point-to-poi response: ", data);

			// --- Draw polygon ---
			if (data.polygon) {
				area_oi = L!.geoJSON(data.polygon).addTo(map!);
			}

			// --- Add amenities ---
			if (data.amenities?.length) {

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
						const marker = L!
							.marker([poi.lat, poi.lon], { icon: selectedIcon })
							.addTo(map!)
							.bindPopup(`<b>${name}</b>`);

						poiMarkers.push(marker); // if you're storing them to remove later
					}
				});
			}
		} catch (err) {
			console.error(err);
			alert("Could not load point-to-poi result");
		}
	}

	function clearMapLayers() {
		// Remove markers
		poiMarkers.forEach((marker) => map!.removeLayer(marker));
		poiMarkers = [];

		// Remove polygons
		map!.removeLayer(area_oi!);
	}

	function handleModeSelect(selectedMode: string) {
		mode = selectedMode;

		// Only redraw if user already picked a location
		if (userLat && userLng) {
			if (area_oi) clearMapLayers(); // clear previous layers
			drawPointToPoi(userLat, userLng, selectedMode as any);
		}
	}

  import Score from "$lib/components/Score.svelte";


</script>

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
  <div class="grid grid-cols-4 gap-3 mt-4">
    {#each transportModes as t}
      <button
        class="
            flex items-center justify-center p-3 rounded-lg border transition
            bg-gray-100
            [&>span>svg]:stroke-current
          "
        class:bg-gray-300={mode === t.value}
        class:text-white={mode === t.value}
        class:border-gray-300={mode === t.value}
        class:bg-gray-100={mode !== t.value}
        class:text-gray-300={mode !== t.value}
        on:click={() => handleModeSelect(t.value)}
      >
        <span class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full">{@html t.icon}</span
        >
      </button>
    {/each}
  </div>

  <!-- Select location button -->
  <button
    class="w-full mt-2 mb-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
    on:click={() => {
      selectingLocation = true;
      sidebarOpen = false;
    }}
  >
    Select location on map
  </button>

  <!-- Transport Modes -->
  <div class="grid grid-cols-4 gap-3 mt-4">
    {#each transportModes as t}
      <!-- ... your existing buttons ... -->
    {/each}
  </div>

  <Score />

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

  /* Selecting location mode */
  :global(.selecting-location) {
    cursor: crosshair !important;
  }

  :global(.selecting-location.leaflet-container.leaflet-drag-target) {
    cursor: grabbing !important;
  }
</style>
