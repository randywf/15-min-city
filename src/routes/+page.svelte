<script lang="ts">
	import { onMount } from 'svelte';
	import { getCafesInParkPolygon } from '$lib/poi-service';
	import type { OverpassElement } from '$lib/poi-service'; // <-- import the type

	// Tell Svelte that cafes is an array of OverpassElement
	let cafes: OverpassElement[] = [];

	onMount(async () => {
		cafes = await getCafesInParkPolygon();
	});
</script>

<h1>Cafes in the Park</h1>
<a href="/map">Go to map</a>

{#if cafes.length === 0}
	<p>Loading cafes…</p>
{:else}
	<ul>
		{#each cafes as cafe}
			<li>{cafe.tags.name ?? 'Unnamed'} — ({cafe.lat}, {cafe.lon})</li>
		{/each}
	</ul>
{/if}