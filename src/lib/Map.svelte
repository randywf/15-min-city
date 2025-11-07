<script>
  import { onMount } from 'svelte';

  let mapDiv;

  // Run once when the component is first added to the page
  onMount(async () => {
    const L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');
    // Create the map
    const map = L.map(mapDiv).setView([51.505, -0.09], 13); // Center on London

    // Add map tiles (the visual layer)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add a marker
    L.marker([51.505, -0.09])
      .addTo(map)
      .bindPopup('Hello from London!')
      .openPopup();
  });
</script>

<style>
  #map {
    height: 400px;
    width: 100%;
  }
</style>

<div id="map" bind:this={mapDiv}></div>