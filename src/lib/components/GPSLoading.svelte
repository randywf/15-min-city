<script lang="ts">
  export let show = false;
</script>

{#if show}
  <div 
    class="fixed inset-0 flex items-center justify-center z-[20000]"
    style="background: rgba(248, 250, 252, 0.72); backdrop-filter: blur(6px) saturate(120%);"
  >
    <div
      class="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3"
      style="width: min(360px, 90vw); border: 1px solid rgba(147, 197, 253, 0.5);"
    >
      <div style="position: relative; width: 96px; height: 96px">
        <span
          style="
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            border: 3px solid transparent;
            border-top-color: #2563eb;
            border-right-color: #93c5fd;
            animation: gps-spin 1.35s linear infinite;
            display: block;
          "
        ></span>
        <span
          style="
            position: absolute;
            inset: 12px;
            border-radius: 9999px;
            border: 3px solid transparent;
            border-top-color: #2563eb;
            border-right-color: #93c5fd;
            opacity: 0.45;
            animation: gps-spin 1.7s linear infinite;
            display: block;
          "
        ></span>
        <span
          style="
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background: #2563eb;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: gps-pulse 1.6s ease-in-out infinite;
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.32);
            display: block;
          "
        ></span>
      </div>
      <div class="text-center">
        <p class="font-bold text-gray-900 m-0">Getting Your Location...</p>
        <p class="text-gray-600 text-sm m-0 mt-0.5">
          Please allow location access in your browser
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes gps-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes gps-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.32);
    }
    70% {
      box-shadow: 0 0 0 18px rgba(37, 99, 235, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
    }
  }
</style>