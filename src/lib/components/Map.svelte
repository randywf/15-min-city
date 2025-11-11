<script lang="ts">
  import { onMount } from 'svelte';

  let mapDiv!: HTMLDivElement;

  // Run once when the component is first added to the page
  onMount(async () => {
    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');
    // Create the map
    const map = L.map(mapDiv).setView([51.96, 7.62], 12);

    // Add map tiles (the visual layer)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      let response = await fetch(`/api/isochrone`, {
        method: 'POST',
        body: JSON.stringify({ locations: [[e.latlng.lng, e.latlng.lat]], range: [300, 200] }),
      });
      let data = await response.json();
      let geojson = L.geoJSON(data);
      geojson.addTo(map);
      console.log(data);
    });
  });

</script>

<style>
  #map {
    height: 400px;
    width: 100%;
  }
</style>

<div id="map" bind:this={mapDiv}></div>