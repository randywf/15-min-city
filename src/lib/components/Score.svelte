<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  // Props - accept amenities from parent
  export let amenities: any[] = [];

  let canvas: HTMLCanvasElement;
  let chart: Chart<"radar">;

  const labels = ["Mobility & Parking", "Healthcare", "Education", "Entertainment", "Food & Beverage", "Other"];

  // Define category mappings
  const CATEGORY_MAPPINGS: Record<string, string[]> = {
    "Mobility & Parking": ["bicycle_parking", "parking", "fuel"],
    "Healthcare": ["clinic", "hospital", "pharmacy"],
    "Education": ["school", "library"],
    "Other": ["place_of_worship:christian","place_of_worship:islamic","place_of_worship:buddhist","place_of_worship:hindu","place_of_worship:jewish","toilets"],
    "Entertainment": ["theatre", "cinema"],
    "Food & Beverage": ["restaurant", "bar", "bbq", "biergarten", "cafe","fast_food", "food_court", "ice_cream", "pub"]
  };

  // Define colors for each category
  const CATEGORY_COLORS: Record<string, { background: string; border: string; hex: string }> = {
    "Mobility & Parking": { background: "rgba(59, 130, 246, 0.3)", border: "rgb(59, 130, 246)", hex: "#3b82f6" },
    "Healthcare": { background: "rgba(220, 38, 38, 0.3)", border: "rgb(220, 38, 38)", hex: "#dc2626" },
    "Education": { background: "rgba(34, 197, 94, 0.3)", border: "rgb(34, 197, 94)", hex: "#22c55e" },
    "Entertainment": { background: "rgba(168, 85, 247, 0.3)", border: "rgb(168, 85, 247)", hex: "#a855f7" },
    "Food & Beverage": { background: "rgba(249, 115, 22, 0.3)", border: "rgb(249, 115, 22)", hex: "#f97316" },
    "Other": { background: "rgba(107, 114, 128, 0.3)", border: "rgb(107, 114, 128)", hex: "#6b7280" }
  };

  // Calculate scores from amenities
  function calculateScores(amenitiesList: any[]): number[] {
    if (!amenitiesList || amenitiesList.length === 0) {
      return [0, 0, 0, 0, 0, 0];
    }

    const totalPois = amenitiesList.length;

    // Count POIs per category
    const counts: Record<string, number> = {
      "Mobility & Parking": 0,
      "Healthcare": 0,
      "Education": 0,
      "Entertainment": 0,
      "Food & Beverage": 0,
      "Other": 0
    };

    amenitiesList.forEach((poi) => {
      const amenityType = poi.amenity || poi.tags?.amenity;
      if (!amenityType) return;

      // Check which category this amenity belongs to
      for (const [category, types] of Object.entries(CATEGORY_MAPPINGS)) {
        if (types.includes(amenityType)) {
          counts[category]++;
        }
      }
    });

    // Convert counts to scores (0-10 scale)
    // Formula: (POIs in category / total POIs) * 10
    return labels.map(label => {
      const count = counts[label];
      
      if (count === 0) return 0;
      
      // Proportion-based scoring: (category POIs / total POIs) * 10
      const score = (count / totalPois) * 10;
      return Math.min(10, Number(score.toFixed(1)));
    });
  }

  // Reactive values based on amenities
  $: values = calculateScores(amenities);

onMount(() => {
    chart = new Chart(canvas, {
      type: "radar",
      data: {
        labels,
        datasets: labels.map((label, index) => ({
          label,
          data: labels.map((l, i) => (i === index ? values[index] : 0)),
          fill: true,
          backgroundColor: CATEGORY_COLORS[label].background,
          borderColor: CATEGORY_COLORS[label].border,
          pointBackgroundColor: CATEGORY_COLORS[label].border,
          borderWidth: 2
        }))
      },
      options: {
        layout: {
          padding: 0
        },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              font: {
                size: 14,
                family: 'Arial'
              },
              color: '#d1d5db',
              backdropColor: 'rgba(255, 255, 255, 0.9)',
              backdropPadding: 2
            },
            pointLabels: {
              font: {
                size: 13,
                family: 'Arial'
              },
              color: '#5c5c5c',
              padding: 5
            },
            grid: {
              color: '#d1d5db'
            },
            angleLines: {
              color: '#d1d5db'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        },
        maintainAspectRatio: true
      }
    });
  });

  // Update chart when values change
  $: if (chart) {
    chart.data.datasets.forEach((dataset, index) => {
      dataset.data = labels.map((l, i) => (i === index ? values[index] : 0));
    });
    chart.update();
  }
</script>

<div class="p-0">
  <canvas bind:this={canvas} width="100" height="100"></canvas>

  <div class="mt-0 space-y-2">
    <div class="text-xs text-gray-600 text-center">
      Total number of POIs: <span class="font-semibold">{amenities.length}</span>
    </div>
    
    {#each labels as label, i}
      <div class="flex items-center gap-3">
        <div class="w-32 flex items-center gap-2">
          <div 
            class="w-3 h-3 rounded-full flex-shrink-0"
            style="background-color: {CATEGORY_COLORS[label].hex};"
          ></div>
          <span class="text-sm">{label}</span>
        </div>
        <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            class="transition-all duration-300"
            style="width: {(values[i] / 10) * 100}%; background-color: {CATEGORY_COLORS[label].hex};"
          ></div>
        </div>
        <div class="w-12 text-right tabular-nums">{values[i].toFixed(1)}</div>
      </div>
    {/each}
  </div>
</div>