<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  // Props - accept amenities from parent
  export let amenities: any[] = [];

  let canvas: HTMLCanvasElement;
  let chart: Chart<"radar">;

  const labels = ["Mobility & Parking", "Healthcare", "Education", "Other", "Entertainment", "Food & Beverage"];

  // Define category mappings
  const CATEGORY_MAPPINGS: Record<string, string[]> = {
    "Mobility & Parking": ["bicycle_parking", "parking", "fuel"],
    "Healthcare": ["clinic", "hospital", "pharmacy"],
    "Education": ["school", "library"],
    "Other": [
      "place_of_worship:christian",
      "place_of_worship:islamic",
      "place_of_worship:buddhist",
      "place_of_worship:hindu",
      "place_of_worship:jewish",
      "toilets"
    ],
    "Entertainment": ["theatre", "cinema"],
    "Food & Beverage": [
      "restaurant", "bar", "bbq", "biergarten", "cafe",
      "fast_food", "food_court", "ice_cream", "pub"
    ]
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
      "Other": 0,
      "Entertainment": 0,
      "Food & Beverage": 0
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
        datasets: [
          {
            label: "Score",
            data: values,
            fill: true,
            backgroundColor: "rgba(231,74,59,0.3)",
            borderColor: "rgb(231,74,59)",
            pointBackgroundColor: "rgb(231,74,59)"
          }
        ]
      },
      options: {
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { display: true }
          }
        }
      }
    });
  });

  // Update chart when values change
  $: if (chart) {
    chart.data.datasets[0].data = values;
    chart.update();
  }
</script>

<div class="p-4">
  <canvas bind:this={canvas} width="100" height="100"></canvas>

  <div class="mt-4 space-y-3">
    {#each labels as label, i}
      <div class="flex items-center gap-3">
        <div class="w-32 text-sm">{label}</div>
        <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            class="h-full bg-red-500 transition-all duration-300"
            style="width: {(values[i] / 10) * 100}%"
          ></div>
        </div>
        <div class="w-12 text-right tabular-nums">{values[i].toFixed(1)}</div>
      </div>
    {/each}
  </div>
</div>