<script lang="ts">
	import { onMount } from "svelte";
	import locationIcon from "$lib/assets/location.svg?raw";
	import educationURL from "$lib/assets/education_rainbow.png";
	import foodURL from "$lib/assets/food_Lime.png";
	import Modal from "$lib/components/Modal.svelte";
	import type { TransportMode } from "$lib/types/map";
	import { MARKER_STYLES, ICON_CONFIG } from "$lib/constants/map";
	import { toSentenceCase, getIconForAmenity } from "$lib/utils/map";

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

	let mapDiv!: HTMLDivElement;
	let L: typeof import("leaflet") | null = null;
	let map: import("leaflet").Map | null = null;
	let userMarker: import("leaflet").Layer | null = null;
	let area_oi: import("leaflet").GeoJSON<any> | null = null;
	let poiMarkers: import("leaflet").Marker[] = [];

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
		if (data.polygon) {
			area_oi = L.geoJSON(data.polygon).addTo(map);
		}

		// Render POI markers
		if (data.amenities?.length) {
			const icons = {
				food: L.icon({ iconUrl: foodURL, ...ICON_CONFIG }),
				education: L.icon({ iconUrl: educationURL, ...ICON_CONFIG }),
			};

			data.amenities.forEach((poi: any) => {
				if (poi.lat && poi.lon) {
					const selectedIcon = getIconForAmenity(poi, icons);
					const amenityLabel = toSentenceCase(poi.amenity);
					const marker = L!
						.marker([poi.lat, poi.lon], {
							icon: selectedIcon,
							title: amenityLabel,
						})
						.addTo(map!)
						.bindPopup(`<b>Category: </b><b>${amenityLabel}</b>`);

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
	});
</script>

<!-- Map Container -->
<div bind:this={mapDiv} class="absolute inset-0 z-[1] top-14"></div>

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
