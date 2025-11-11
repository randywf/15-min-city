<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
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
