<script lang="ts">
  export let show = false;
  export let onClose: (() => void) | undefined = undefined;
  
  function handleClose() {
    show = false;
    if (onClose) {
      onClose();
    }
  }
</script>

{#if show}
  <div class="absolute top-20 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 z-[10001] relative w-auto max-w-md">
    <button
      class="absolute top-1 right-1 text-gray-500 hover:text-gray-800 text-3xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 z-10"
      aria-label="Close modal"
      on:click={handleClose}
    >×</button>
    <div class="pr-6 flex flex-col items-center justify-center">
      <slot />
    </div>
  </div>
{/if}