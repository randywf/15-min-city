<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();

	onMount(() => {
		if (!browser) return;

		const path = window.location.pathname;

		// ALWAYS redirect to /login on reload or fresh load
		if (path !== '/login') {
			goto('/login');
		}
	});
</script>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
	}
</style>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
