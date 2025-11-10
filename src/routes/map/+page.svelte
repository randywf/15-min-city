<script lang="ts">

// disable SSR for this route (prevents "window is not defined")
  export const ssr = false;

  import { onMount } from 'svelte';
  import { getCafesInParkPolygon } from '$lib/poi-service';
  import 'leaflet/dist/leaflet.css';

  // We'll load Leaflet at runtime
  let mapDiv!: HTMLDivElement;

  type Cafe = {
    lat?: number; lon?: number;
    center?: { lat: number; lon: number };
    tags: { name?: string };
  };

  let cafes: Cafe[] = [];

  onMount(async () => {
    const L = await import('leaflet');

    // (optional) fix default marker icons in Vite
    const icon = L.icon({
      iconUrl: (await import('leaflet/dist/images/marker-icon.png')).default,
      iconRetinaUrl: (await import('leaflet/dist/images/marker-icon-2x.png')).default,
      shadowUrl: (await import('leaflet/dist/images/marker-shadow.png')).default,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = icon;

    const map = L.map(mapDiv).setView([51.96, 7.62], 12);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    cafes = await getCafesInParkPolygon();

    for (const c of cafes) {
      const lat = c.lat ?? c.center?.lat;
      const lon = c.lon ?? c.center?.lon;
      if (lat != null && lon != null) {
        L.marker([lat, lon]).addTo(map)
          .bindPopup(c.tags.name ?? 'Unnamed Café');
      }
    }

    map.on('click', (e: any) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`You clicked at ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`)
        .openOn(map);
    });
  });
</script>

<div bind:this={mapDiv} style="width:100%; height:400px;"></div>

{#if cafes.length === 0}
  <p>Loading cafés…</p>
{:else}
  <ul>
    {#each cafes as c}
      <li>{c.tags.name ?? 'Unnamed'} — ({c.lat ?? c.center?.lat}, {c.lon ?? c.center?.lon})</li>
    {/each}
  </ul>
{/if}