<script lang="ts">
	import { onMount } from "svelte";
	import locationIcon from "$lib/assets/location.svg?raw";
	import educationURL from "$lib/assets/education_rainbow.png";
	import foodURL from "$lib/assets/food_Lime.png";
	import Modal from "$lib/components/Modal.svelte";
	import LayerPanel from "$lib/components/LayerPanel.svelte";
	import type { TransportMode } from "$lib/types/map";
	import { MARKER_STYLES, ICON_CONFIG } from "$lib/constants/map";
	import { toSentenceCase, getIconForAmenity } from "$lib/utils/map";
	import { CATEGORY_COLORS, ISOCHRONE_COLORS } from "$lib/constants/colors";

	// Add the münster boundary layer
	async function addMuensterBoundary() {
	if (!L || !map) return;
	if (boundaryLayer) map.removeLayer(boundaryLayer);
	
	try {
		const response = await fetch("/data/muenster_boundary.geojson");
		let muensterBoundary = await response.json();
		
		// Remove CRS to avoid parsing issues
		if (muensterBoundary.crs) {
		delete muensterBoundary.crs;
		}
		
		console.log("Boundary features:", muensterBoundary.features?.length);
		
		boundaryLayer = L.geoJSON(muensterBoundary, {
		style: (feature) => ({
			color: "#000000",
			weight: 2,
			fill: false,
			fillOpacity: 0,
		}),
		interactive: false,
		}).addTo(map!);
		
		// Fit map to boundary
		const bounds = boundaryLayer.getBounds();
		map!.fitBounds(bounds);
		
		console.log("Münster boundary loaded");
	} catch (e) {
		console.error("Failed to load Münster boundary:", e);
	}
	}

	// Props
	export let mode: TransportMode;
	export let location: {
		selected: boolean;
		lat: number | null;
		lng: number | null;
	};
	export let selectingLocation: boolean;
	export let poiData: {
		amenities: any[];
		polygon: any;
	} | null = null;

	// Event callbacks (Svelte 5 style)
	export let onMapReady: ((event: { L: any; map: any }) => void) | undefined =
		undefined;
	export let onLocationSelected:
		| ((event: { lat: number; lng: number }) => void)
		| undefined = undefined;
	export let onLocationRequested:
		| ((event: { lat: number; lng: number }) => void)
		| undefined = undefined;
	export let onError: ((event: { message: string }) => void) | undefined =
		undefined;
	export let onCancelSelection: (() => void) | undefined = undefined;

	const CATEGORY_MAPPINGS: Record<string, string[]> = {
		"Mobility & Parking": ["bicycle_parking", "parking", "fuel"],
		Healthcare: ["clinic", "hospital", "pharmacy"],
		Education: ["school", "library"],
		Entertainment: ["theatre", "cinema"],
		"Food & Beverage": ["restaurant", "bar", "bbq", "biergarten", "cafe", "fast_food", "food_court", "ice_cream", "pub"],
		Other: [
			"place_of_worship:christian",
			"place_of_worship:islamic",
			"place_of_worship:buddhist",
			"place_of_worship:hindu",
			"place_of_worship:jewish",
			"toilets"
		]
	};

	let enabledCategories: Record<string, boolean> = {
		"Mobility & Parking": true,
		Healthcare: true,
		Education: true,
		Entertainment: true,
		"Food & Beverage": true,
		Other: true
	};

	let showIsochrone = true;
	let panelExpanded = false;
	
	const categoryOrder = Object.keys(CATEGORY_MAPPINGS);

	$: hasData = poiData && (poiData.amenities.length > 0 || poiData.polygon);


	let mapDiv!: HTMLDivElement;
	let L: typeof import("leaflet") | null = null;
	let map: import("leaflet").Map | null = null;
	let userMarker: import("leaflet").Layer | null = null;
	let area_oi: import("leaflet").GeoJSON<any> | null = null;
	let boundaryLayer: import("leaflet").GeoJSON<any> | null = null;
	let poiMarkers: import("leaflet").Marker[] = [];

	// Handlers for LayerPanel
	function togglePanel() {
		panelExpanded = !panelExpanded;
	}

	function toggleIsochrone(value: boolean) {
		showIsochrone = value;
	}

	function toggleCategory(category: string) {
		enabledCategories = {
		...enabledCategories,
		[category]: !enabledCategories[category],
		};
	}
	
	// Map amenity type to category
	function findCategoryForAmenity(amenityType: string | undefined): string | null {
    if (!amenityType) return null;
    const match = Object.entries(CATEGORY_MAPPINGS).find(([, types]) =>
        types.includes(amenityType)
    );
    return match ? match[0] : null;
	}

	/**
	 * Add/remove selecting-location class for cursor change
	 */
	$: if (map && L) {
		const container = map.getContainer();
		if (selectingLocation) {
			container.classList.add("selecting-location");
		} else {
			container.classList.remove("selecting-location");
		}
	}

	/**
	 * When POI data changes, render it on the map
	 */
	$: if (L && map) {
		if (poiData) {
			enabledCategories;
			showIsochrone;
			renderPoiData(poiData);
		} else {
			clearMapLayers();
		}
	}

	/**
	 * Initialize the Leaflet library
	 */
	async function initializeLeaflet() {
		const leaflet = await import("$lib/leaflet-client");
		L = leaflet.default as any;
		console.log("[leaflet] typeof heatLayer =", typeof (L as any).heatLayer);
	}

	/**
	 * Create tile layers
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
	 * Setup the map instance
	 */
	function setupMapInstance(layers: any) {
		map = L!.map(mapDiv, {
			center: [51.96, 7.62],
			zoom: 12,
			layers: [layers.osm],
		});

		const baseLayers = {
			OpenStreetMap: layers.osm,
			Satellite: layers.satellite,
			Topographic: layers.topo,
		};
		L!.control.layers(baseLayers).addTo(map);
		map.zoomControl.setPosition("bottomright");

		// Call map ready callback
		onMapReady?.({ L, map });
	}

	/**
	 * Register map event handlers
	 */
	function registerMapEventHandlers() {
		map!.on("click", async (e: any) => {
			if (selectingLocation) {
				const { lat, lng } = e.latlng;
				map!.setView([lat, lng], 15);

				// Remove old marker
				if (userMarker) {
					map!.removeLayer(userMarker);
				}

				// Create new marker
				userMarker = L!.circleMarker([lat, lng], MARKER_STYLES).addTo(map!);

				// Call location selected callback
				onLocationSelected?.({ lat, lng });
			}
		});
	}

	/**
	 * Create a user marker
	 */
	function createUserMarker(lat: number, lng: number): import("leaflet").Layer {
		return L!.circleMarker([lat, lng], MARKER_STYLES).addTo(map!);
	}

	/**
	 * Clear all POI markers and polygons from map
	 */
	function clearMapLayers() {
		poiMarkers.forEach((marker) => map!.removeLayer(marker));
		poiMarkers = [];

		if (area_oi) {
			map!.removeLayer(area_oi);
			area_oi = null;
		}
	}

	/**
	 * Render POI data (polygon and markers)
	 */
	function renderPoiData(data: { amenities: any[]; polygon: any }) {
		if (!L || !map) return;

		// Clear previous data
		clearMapLayers();

		// Render polygon
		if (data.polygon && showIsochrone) {
			area_oi = L.geoJSON(data.polygon, {
				style: {
					color: ISOCHRONE_COLORS.stroke, 
					fillColor: ISOCHRONE_COLORS.fill,
					fillOpacity: 0.1,                     
					weight: 1                           
				}
			}).addTo(map);
		}

		// Render POI markers
		if (data.amenities?.length) {
			const enabledAmenityTypes = new Set<string>();
			Object.entries(enabledCategories).forEach(([cat, enabled]) => {
				if (enabled) {
					CATEGORY_MAPPINGS[cat]?.forEach((t) => enabledAmenityTypes.add(t));
				}
			});

			if (enabledAmenityTypes.size === 0) return;

			const baseMarkerStyle = { ...MARKER_STYLES, radius: 7 };

			data.amenities.forEach((poi: any) => {
				if (poi.lat && poi.lon) {
					const amenityType = poi.amenity ?? poi.tags?.amenity;
					const category = findCategoryForAmenity(amenityType);
					if (!amenityType || !category || !enabledAmenityTypes.has(amenityType)) return;

					const color = CATEGORY_COLORS[category] ?? "#6b7280";
					const marker = L!
						.circleMarker([poi.lat, poi.lon], {
							...baseMarkerStyle,
							color,          // stroke
							fillColor: color,
							fillOpacity: 0.8,
						})
						.addTo(map!)
						.bindPopup(
							`<b>Category:</b> ${category}<br/><b>Amenity:</b> ${toSentenceCase(amenityType)}`
						);

					poiMarkers.push(marker);
				}
			});
		}
	}

	/**
	 * Handle browser location request
	 */
	function requestBrowserLocation() {
		if (!("geolocation" in navigator)) {
			alert("Geolocation not supported.");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				if (map) {
					map.setView([latitude, longitude], 15);
					onLocationRequested?.({ lat: latitude, lng: longitude });
				}
			},
			(err) => {
				console.error(err);
				onError?.({ message: "Could not retrieve location." });
			},
			{ enableHighAccuracy: true },
		);
	}

	/**
	 * Pan to user's saved location
	 */
	function goToMyLocation() {
		if (location.lat && location.lng && map) {
			map.setView([location.lat, location.lng], 16, { animate: true });
		} else {
			alert("Location not available yet");
		}
	}

	/**
	 * Update user marker when location changes
	 */
	$: if (L && map) {
		if (location.lat && location.lng && location.selected) {
			// Remove old marker
			if (userMarker) {
				map.removeLayer(userMarker);
			}
			// Create new marker
			userMarker = createUserMarker(location.lat, location.lng);
		} else {
			// Clear marker when location is not selected
			if (userMarker) {
				map.removeLayer(userMarker);
				userMarker = null;
			}
		}
	}

	onMount(async () => {
		await initializeLeaflet();
		const layers = createTileLayers();
		setupMapInstance(layers);
		registerMapEventHandlers();
		await addMuensterBoundary();
	});
</script>

<!-- Map Container -->
<div bind:this={mapDiv} class="absolute inset-0 z-[1] top-14"></div>

<LayerPanel
  hasData={!!hasData}
  panelExpanded={panelExpanded}
  onTogglePanel={togglePanel}
  showIsochrone={showIsochrone}
  onToggleIsochrone={toggleIsochrone}
  poiData={poiData}
  categoryOrder={categoryOrder}
  categoryColors={CATEGORY_COLORS}
  enabledCategories={enabledCategories}
  onToggleCategory={toggleCategory}
/>

<div class="absolute bottom-28 right-3 z-[10000]">
  <button
    class="w-9 h-9 rounded-full bg-white shadow-lg border flex items-center justify-center hover:bg-gray-100"
    on:click={goToMyLocation}
  >
    <span class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full">{@html locationIcon}</span>
  </button>
</div>

<!-- Floating Map Controls -->
<div class="absolute bottom-28 right-3 z-[10000]">
	<button
		class="w-9 h-9 rounded-full bg-white shadow-lg border flex items-center justify-center hover:bg-gray-100"
		on:click={goToMyLocation}
	>
		<span class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full"
			>{@html locationIcon}</span
		>
	</button>
</div>

<div class="absolute bottom-40 right-3 z-[10000]">
	<button
		class="w-9 h-9 rounded-full bg-white shadow-lg border flex items-center justify-center hover:bg-gray-100"
		on:click={requestBrowserLocation}
	>
		📍
	</button>
</div>

<!-- Location Selection Modal -->
<Modal show={selectingLocation} onClose={() => onCancelSelection?.()}>
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
