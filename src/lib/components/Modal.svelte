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
  <div class="absolute top-20 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 z-[10001]">
    <div class="flex items-center gap-2">
      <div class="flex flex-col items-center">
        <slot />
      </div>
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg font-bold px-2 py-0.5 rounded focus:outline-none"
        aria-label="Close modal"
        on:click={handleClose}
        style="background: none; border: none;"
      >×</button>
    </div>
  </div>
{/if}