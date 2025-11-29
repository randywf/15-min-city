<script lang="ts">
	import { onMount } from "svelte";
	import walk from "$lib/assets/walk.svg?raw";
	import bicycle from "$lib/assets/bicycle.svg?raw";
	import car from "$lib/assets/car.svg?raw";
	import bus from "$lib/assets/bus.svg?raw";
	import location from "$lib/assets/location.svg?raw";
	import search from "$lib/assets/search.svg?raw";
    import {getPointToPoi} from "$lib/services/full-service";

	let mapDiv!: HTMLDivElement;
	let sidebarOpen = false;
	let mode = "walking";
	let storeMap: any;
	let userLat: number | null = null;
	let userLng: number | null = null;
	let userAccuracy: number | null = null;
	let selectingLocation = false; // select location mode
	let selectedMarker: any = null; // store last selected location

	// Leaflet map and library reference (declared here to be accessible in functions)
	let L: typeof import("leaflet") | null = null;
	let map: import("leaflet").Map | null = null;
	let userMarker: import("leaflet").Marker | null = null;

	const transportModes = [
		{
			name: "Walking",
			value: "walking",
			icon: walk,
		},
		{
			name: "Bicycle",
			value: "bicycle",
			icon: bicycle,
		},
		{
			name: "Car",
			value: "car",
			icon: car,
		},
		{
			name: "Public Transport",
			value: "public",
			icon: bus,
		},
	];

	// Run once when the component is first added to the page
	onMount(async () => {
		L = await import("leaflet");
		await import("leaflet/dist/leaflet.css");

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
					// add the location marker
				}

				// Add new marker and remember it
				userMarker = L!.marker([lat, lng]).addTo(map!);

				selectingLocation = false;
				return;
			}

			// Normal behaviour (no select mode): calculate isochrone on click
			let profile = "foot-walking";
			let range = [5 * 60, 10 * 60, 15 * 60];
			let body = {
				locations: [[e.latlng.lng, e.latlng.lat]],
				range: range,
				range_type: "time",
				profile: profile,
			};
		});

        let response = await getPointToPoi(userLat, userLng, "walk", 60);

        let data = await response.json();
        data.features.forEach((feature: GeoJSON.Feature) => {
            let geojson = L.geoJSON(feature.geometry);
            geojson.addTo(map);
        });

		// Add zoom control to bottom right
		map.zoomControl.setPosition("bottomright");

		// Close sidebar on map click
		map.on("click", () => {
			if (sidebarOpen) sidebarOpen = false;
		});
	});

	// called when the button is clicked
	 async function requestBrowserLocation() {
		if (!L || !map) return; // safety

		if (!("geolocation" in navigator)) {
			alert("Geolocation is not available in this browser.");
			return;
		}

		 navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;

				userLat = latitude;
				userLng = longitude;

				map!.setView([latitude, longitude], 15);

				// remove old marker if any
				if (userMarker) {
					map!.removeLayer(userMarker);
				}

				// add new marker
				userMarker = L!.marker([latitude, longitude]).addTo(map!);
			},
			(err) => {
				console.error("Location error:", err);
				alert("Could not get your location.");
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
	class="fixed top-14 left-0 h-[calc(100%-3.5rem)] w-64 bg-white shadow-xl p-4 transition-transform duration-300 z-[1004]"
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
				on:click={() => (mode = t.value)}
			>
				<span class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full"
					>{@html t.icon}</span
				>
			</button>
		{/each}
	</div>

	<!-- Search Field ... (already there) -->

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
</div>

<!--button to zoom to location-->
<div class="absolute bottom-28 right-3 z-[10000]">
	<button
		class="w-9 h-9 rounded-full bg-white shadow-lg border flex items-center justify-center hover:bg-gray-100"
		on:click={goToMyLocation}
	>
		<span class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full"
			>{@html location}</span
		>
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
</style>
