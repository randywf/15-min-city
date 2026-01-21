<script lang="ts">
	export let show = false;
	export let variant: "dark" | "blur" = "blur";
	export let zIndex: number = 10000;
	export let closeable: boolean = false;
	export let onClose: (() => void) | undefined = undefined;

	function handleClose() {
		if (!closeable) return;
		show = false;
		if (onClose) {
			onClose();
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 flex items-center justify-center"
		class:bg-black={variant === "dark"}
		class:bg-opacity-50={variant === "dark"}
		style="z-index: {zIndex}; {variant === 'blur'
			? 'background: rgba(248, 250, 252, 0.72); backdrop-filter: blur(6px) saturate(120%);'
			: ''}"
	>
		<div class="relative">
			{#if closeable}
				<button
					class="absolute top-1 right-1 text-gray-500 hover:text-gray-800 text-3xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 z-10"
					aria-label="Close"
					on:click={handleClose}
				>×</button>
			{/if}
			<slot />
		</div>
	</div>
{/if}
