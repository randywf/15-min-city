<script lang="ts">
  import search from "$lib/assets/search.svg?raw";
  import Score from "$lib/components/Score.svelte";
  import Heatmap from "$lib/components/Heatmap.svelte";
  import type { TransportMode } from "$lib/types/map";
  import { TRANSPORT_MODES } from "$lib/constants/map";
  import type { HeatmapPoi } from "$lib/services/heatmap-service";

  // Props
  export let open: boolean;
  export let mode: TransportMode;
  export let location: {
    selected: boolean;
    lat: number | null;
    lng: number | null;
  };
  export let heatmap: {
    L: any;
    map: any;
    pois: HeatmapPoi[];
    loading: boolean;
    error: string | null;
  };

  // Score calculation
  export let amenities: any[] = [];

  // Event callbacks (Svelte 5 style)
  export let onModeSelect: ((event: { mode: string }) => void) | undefined =
    undefined;
  export let onSelectLocation: (() => void) | undefined = undefined;
  export let onClearSelection: (() => void) | undefined = undefined;

  function handleModeClick(value: string) {
    onModeSelect?.({ mode: value });
  }

  function handleSelectLocation() {
    onSelectLocation?.();
  }

  function handleClear() {
    onClearSelection?.();
  }

  import { geocodeAddress, type GeocodeResult } from "$lib/services/geocode-service";
  
  let searchQuery = "";
  let searchResults: GeocodeResult[] = [];
  let isSearching = false;
  let showResults = false;

  export let onSearchSelect: ((event: { lat: number; lng: number; name: string }) => void) | undefined = undefined;

  async function handleSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      showResults = false;
      return;
    }
    
    isSearching = true;
    try {
      searchResults = await geocodeAddress(searchQuery);
      showResults = searchResults.length > 0;
    } catch (error) {
      console.error("Search failed:", error);
      searchResults = [];
      showResults = false;
    } finally {
      isSearching = false;
    }
  }

  function selectResult(result: GeocodeResult) {
    searchQuery = result.name;
    showResults = false;
    onSearchSelect?.({ lat: result.lat, lng: result.lng, name: result.name });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }  

</script>

<div
  class="fixed top-14 left-0 h-[calc(100%-3.5rem)] w-[296px] max-w-[400px] min-w-[400px]
       bg-white shadow-xl p-4 transition-transform duration-300 z-[1004]
       overflow-y-auto overflow-x-hidden"
  class:translate-x-[-100%]={!open}
>
<!-- Search Field -->
<div class="mt-0">
  <div class="relative mb-4">
    <input
      type="text"
      placeholder="Search place or amenity"
      bind:value={searchQuery}
      on:keydown={handleKeydown}
      on:input={() => showResults = true}
      class="w-full border border-gray-400 rounded-lg py-2 pl-3 pr-10 text-gray-700 shadow-sm"
    />
    <button
      class="absolute top-1.5 right-2 z-[10000] w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-gray-100"
      on:click={handleSearch}
      disabled={isSearching}
    >
      <span class="w-4 h-4 [&>svg]:w-full [&>svg]:h-full">{@html search}</span>
    </button>
    
    <!-- Search Results Dropdown -->
    {#if showResults && searchResults.length > 0}
      <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[10001] max-h-60 overflow-y-auto">
        {#each searchResults as result}
          <button
            class="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
            on:click={() => selectResult(result)}
          >
            <div class="font-medium text-gray-700">{result.name.split(',')[0]}</div>
            <div class="text-xs text-gray-500">{result.lat.toFixed(4)}, {result.lng.toFixed(4)}</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

  <!-- Transport Modes -->
  <div class="mt-">
    <h1 class="text-sm font-semibold text-gray-900 mb-4">Transport Mode</h1>
    <div class="flex gap-3 w-full">
      {#each TRANSPORT_MODES as t}
        <button
          class="flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
               hover:border-blue-400 flex-1"
          class:bg-blue-100={mode === t.value}
          class:border-blue-500={mode === t.value}
          class:bg-gray-50={mode !== t.value}
          class:border-gray-200={mode !== t.value}
          on:click={() => handleModeClick(t.value)}
        >
          <span class="w-7 h-7 mb-2 [&>svg]:w-full [&>svg]:h-full [&_path]:stroke-current [&_path]:fill-current"
            class:text-blue-500={mode === t.value}
            class:text-gray-600={mode !== t.value}
            >{@html t.icon}</span
          >
          <span class="text-xs font-medium capitalize transition-colors"
            class:text-blue-500={mode === t.value}
            class:text-gray-600={mode !== t.value}
          >{t.value}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Select location and Clear buttons -->
  <div class="grid grid-cols-4 gap-2 mt-4 mb-4">
    <button
      class="col-span-3 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
      on:click={handleSelectLocation}
    >
      Select Location on Map
    </button>

    <button
      class="col-span-1 py-3 rounded-lg text-sm font-medium transition-all"
      class:bg-red-500={location.selected}
      class:text-white={location.selected}
      class:hover:bg-red-600={location.selected}
      class:bg-gray-200={!location.selected}
      class:text-gray-400={!location.selected}
      class:cursor-not-allowed={!location.selected}
      disabled={!location.selected}
      on:click={handleClear}
    >
      Clear
    </button>
  </div>

  <!-- Accessibility Score Section -->
  <div class="mt-6">
    <h3 class="text-base font-semibold text-gray-600 mb-4">
      Accessibility Score
    </h3>
    <Score {amenities} />
  </div>

  <Heatmap
    L={heatmap.L}
    map={heatmap.map}
    heatmapPois={heatmap.pois}
    loading={heatmap.loading}
    error={heatmap.error}
  />
</div>
