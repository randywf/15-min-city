<script lang="ts">
  export let hasData: boolean;
  export let panelExpanded: boolean;
  export let onTogglePanel: () => void;
  export let showIsochrone: boolean;
  export let onToggleIsochrone: (value: boolean) => void;
  export let poiData: { amenities: any[]; polygon: any } | null = null;
  export let categoryOrder: string[];
  export let categoryColors: Record<string, string>;
  export let enabledCategories: Record<string, boolean>;
  export let onToggleCategory: (category: string) => void;

  const ISOCHRONE_COLORS = {
    fill: "#6b7280",
    stroke: "#4b5563",
  };
</script>

{#if hasData}
<div class="absolute top-16 right-20 z-[10000] w-56">
  <div class="bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-lg overflow-hidden">
    <button
      class="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      on:click={onTogglePanel}
    >
      <span class="text-sm font-semibold text-gray-800">Layers</span>
      <svg
        class="w-4 h-4 transition-transform text-gray-600"
        class:rotate-180={panelExpanded}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {#if panelExpanded}
      <div class="border-t max-h-96 overflow-y-auto">
        {#if poiData?.polygon}
        <div class="p-3 border-b bg-gray-50">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="flex items-center gap-2">
              <span
                class="block w-3 h-3 border"
                style={`background:${ISOCHRONE_COLORS.fill}; border-color:${ISOCHRONE_COLORS.stroke};`}
              ></span>
              <span class="text-xs font-semibold text-gray-800">Isochrone Boundary</span>
            </span>
            <input
              type="checkbox"
              class="w-4 h-4 accent-blue-600"
              checked={showIsochrone}
              on:change={(e) => onToggleIsochrone(e.currentTarget.checked)}
            />
          </label>
        </div>
        {/if}

        {#if poiData?.amenities && poiData.amenities.length > 0}
        <div class="p-2">
          <div class="text-xs font-semibold text-gray-600 px-2 py-1.5">POI Categories</div>
          {#each categoryOrder as category}
            <label class="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
              <span class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style={`background:${categoryColors[category]}`}></span>
                <span class="text-xs font-medium text-gray-800">{category}</span>
              </span>
              <input
                type="checkbox"
                class="w-4 h-4 accent-blue-600"
                checked={enabledCategories[category]}
                on:change={() => onToggleCategory(category)}
              />
            </label>
          {/each}
        </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
{/if}