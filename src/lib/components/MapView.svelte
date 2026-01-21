<script lang="ts">
	import { onMount } from "svelte";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import MapCanvas from "$lib/components/MapCanvas.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import ErrorNotification from "$lib/components/ErrorNotification.svelte";
	import { getPointToPoi } from "$lib/services/isochrone-service";
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
		location.selected = false; // Will be set to true after successful fetch

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

			const data = await getPointToPoi(
				lng,
				lat,
				transportMode,
				900,
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
		onModeSelect={handleModeSelect}
		onSelectLocation={handleSelectLocation}
		onClearSelection={handleClear}
	/>

	<!-- Map Canvas -->
	<MapCanvas
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
	{#if ui.isInitialLoading}
		<div
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
		>
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
				<p class="text-lg font-semibold text-gray-700">
					Loading map and data...
				</p>
			</div>
		</div>
	{/if}

	<!-- Transport Mode Loading -->
	<Loading show={ui.isIsochroneLoading} onClose={handleAbortPoi} />
</div>

<!-- Error Notifications -->
<ErrorNotification bind:this={notificationComponent} />
