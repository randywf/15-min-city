<script lang="ts">
  import type { HeatmapPoi } from "$lib/services/heatmap-service";
  import {
    AMENITIES,
    AMENITY_GRADIENTS,
    type Amenity,
  } from "$lib/constants/amenities";

  export let L: any = null; // Leaflet instance with heatLayer
  export let map: any = null; // Leaflet map
  export let heatmapPois: HeatmapPoi[] = [];
  export let loading = false;
  export let error: string | null = null;

  let open = false;
  let heatmapMode = false;

  // chip dropdown state
  let pickerOpen = false;
  let search = "";
  let selected: Amenity[] = [];

  $: options = AMENITIES.filter(
    (a) =>
      !selected.includes(a) && a.toLowerCase().includes(search.toLowerCase()),
  );

  let layersByAmenity: Partial<Record<Amenity, any>> = {};

  function makeLayer(amenity: Amenity) {
    if (!L || !map) return null;

    const pts = heatmapPois
      .filter(
        (p) =>
          p.amenity === amenity &&
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lon),
      )
      .map(
        (p) =>
          [p.lat, p.lon, p.weight ?? p.count ?? 1] as [number, number, number],
      );

    if (!pts.length) return null;

    return (L as any).heatLayer(pts, {
      radius: 25,
      blur: 18,
      maxZoom: 17,
      gradient: AMENITY_GRADIENTS[amenity],
    });
  }

  function enableAmenity(amenity: Amenity) {
    if (!L || !map) return;
    if (typeof (L as any).heatLayer !== "function") {
      console.error("[Heatmap] leaflet.heat not loaded");
      return;
    }
    if (!heatmapPois?.length) return;
    if (layersByAmenity[amenity]) return;

    const layer = makeLayer(amenity);
    if (!layer) return;

    layer.addTo(map);
    layersByAmenity = { ...layersByAmenity, [amenity]: layer };
  }

  function disableAmenity(amenity: Amenity) {
    if (!map) return;

    const layer = layersByAmenity[amenity];
    if (layer) map.removeLayer(layer);

    const { [amenity]: _, ...rest } = layersByAmenity;
    layersByAmenity = rest;
  }

  function applySelection() {
    if (!heatmapMode) return;

    const sel = new Set(selected);
    for (const a of AMENITIES) {
      const isSel = sel.has(a);
      const isEnabled = !!layersByAmenity[a];
      if (isSel && !isEnabled) enableAmenity(a);
      if (!isSel && isEnabled) disableAmenity(a);
    }
  }

  function setMode(on: boolean) {
    heatmapMode = on;

    if (!on) {
      // remove all layers but keep selected chips
      for (const a of AMENITIES) disableAmenity(a);
      layersByAmenity = {};
      return;
    }

    applySelection();
  }

  function addAmenity(a: Amenity) {
    if (selected.includes(a)) return;
    selected = [...selected, a];
    search = "";
    if (heatmapMode) enableAmenity(a); // instant add
  }

  function removeAmenity(a: Amenity) {
    selected = selected.filter((x) => x !== a);
    if (heatmapMode) disableAmenity(a); // instant remove
  }

  function selectAll() {
    selected = [...AMENITIES];
    if (heatmapMode) AMENITIES.forEach(enableAmenity);
  }

  function clearAll() {
    if (heatmapMode) selected.forEach(disableAmenity);
    selected = [];
    layersByAmenity = {};
  }
</script>

<div class="mt-4 border-t pt-3">
  <!-- header with collapse + On/Off -->
  <button
    type="button"
    class="w-full flex items-center justify-between py-2"
    on:click={() => {
      open = !open;
      if (!open) pickerOpen = false;
    }}
  >
    <div class="flex items-center gap-2">
      <span
        class="inline-block transition-transform"
        style="transform: rotate({open ? 90 : 0}deg);"
      >
        ▶
      </span>
      <span class="text-sm font-semibold text-gray-700">Heatmap</span>
    </div>

    <label class="flex items-center gap-2 text-sm" on:click|stopPropagation>
      <input
        type="checkbox"
        checked={heatmapMode}
        on:change={(e) =>
          setMode((e.currentTarget as HTMLInputElement).checked)}
        disabled={loading}
      />
      <span>{heatmapMode ? "On" : "Off"}</span>
    </label>
  </button>

  {#if open}
    <div class="mt-1">
      <label class="text-xs text-gray-600">Select amenities</label>

      <!-- chips + searchable dropdown -->
      <div class="mt-2 relative">
        <div
          class="w-full max-w-full border rounded-lg bg-white px-2 py-2 flex flex-wrap gap-2 items-start cursor-text
         max-h-24 overflow-y-auto overflow-x-hidden"
          on:click={() => (pickerOpen = true)}
        >
          {#each selected as a (a)}
            <span
              class="flex items-center gap-2 px-2 py-1 text-xs rounded bg-gray-100 border max-w-full min-w-0"
            >
              <span class="capitalize truncate max-w-[120px]">
                {a.replaceAll("_", " ")}
              </span>
              <span
                class="w-2 h-2 rounded-full"
                style="background:{AMENITY_GRADIENTS[
                  a
                ][0.6]}; border:1px solid #ddd;"
              />
              <button
                type="button"
                class="text-gray-500 hover:text-black leading-none"
                on:click|stopPropagation={() => removeAmenity(a)}
              >
                ✕
              </button>
            </span>
          {/each}

          <input
            class="flex-1 min-w-0 w-20 outline-none text-sm px-1"
            placeholder={selected.length ? "" : "Type to search…"}
            bind:value={search}
            on:focus={() => (pickerOpen = true)}
            on:keydown={(e) => {
              if (e.key === "Backspace" && search === "" && selected.length) {
                removeAmenity(selected[selected.length - 1]);
              }
              if (e.key === "Escape") {
                pickerOpen = false;
                search = "";
              }
            }}
            disabled={loading}
          />

          <button
            type="button"
            class="ml-auto text-gray-500 hover:text-black px-1"
            on:click|stopPropagation={() => (pickerOpen = !pickerOpen)}
          >
            ▾
          </button>
        </div>

        {#if pickerOpen}
          <div
            class="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-[3000]"
          >
            <div class="max-h-56 overflow-auto">
              {#if options.length === 0}
                <div class="p-3 text-sm text-gray-500">No matches</div>
              {:else}
                {#each options as a (a)}
                  <button
                    type="button"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                    on:click={() => addAmenity(a)}
                  >
                    <span class="capitalize">{a.replaceAll("_", " ")}</span>
                    <span
                      class="ml-auto w-3 h-3 rounded-full"
                      style="background:{AMENITY_GRADIENTS[
                        a
                      ][0.6]}; border:1px solid #ddd;"
                    />
                  </button>
                {/each}
              {/if}
            </div>

            <div class="p-2 border-t flex gap-2">
              <button
                type="button"
                class="flex-1 px-2 py-2 text-xs rounded border hover:bg-gray-50"
                on:click={selectAll}
              >
                Select all
              </button>
              <button
                type="button"
                class="flex-1 px-2 py-2 text-xs rounded border hover:bg-gray-50"
                on:click={clearAll}
              >
                Clear
              </button>
              <button
                type="button"
                class="flex-1 px-2 py-2 text-xs rounded bg-gray-900 text-white hover:bg-black"
                disabled={!heatmapMode}
                on:click={() => {
                  applySelection();
                  pickerOpen = false;
                  search = "";
                }}
              >
                Apply
              </button>
            </div>
          </div>
        {/if}
      </div>

      {#if loading}
        <div class="mt-2 text-xs text-gray-500">Loading heatmap data…</div>
      {/if}
      {#if error}
        <div class="mt-2 text-xs text-red-600">{error}</div>
      {/if}
    </div>
  {/if}
</div>
