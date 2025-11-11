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
      let profile = 'foot-walking';
      let range = [5 * 60, 10 * 60, 15 * 60];
      let body = {
        locations: [[e.latlng.lng, e.latlng.lat]],
        range: range,
        range_type: 'time',
        profile: profile
      };
      let response = await fetch(`/api/isochrone`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      let data = await response.json();
      data.features.forEach((feature: GeoJSON.Feature) => {
        let geojson = L.geoJSON(feature.geometry);
        geojson.addTo(map);
      });
    });
  });

</script>

<style>
  #map {
    height: 100%;
    width: 100%;
  }
</style>

<div id="map" bind:this={mapDiv}></div>