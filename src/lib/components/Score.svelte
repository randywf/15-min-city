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
        datasets: [
          {
            label: "Accessibility Score",
            data: values,
            fill: true,
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            borderColor: "rgba(59, 130, 246, 0.8)",
            pointBackgroundColor: labels.map(label => CATEGORY_COLORS[label].hex),
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: labels.map(label => CATEGORY_COLORS[label].hex),
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointRadius: 5,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: {
            top: 10,
            bottom: 5,
            left: 10,
            right: 10
          }
        },
        scales: {
          r: {
            min: 0,
            max: 10,
            beginAtZero: true,
            ticks: {
              stepSize: 2,
              font: {
                size: 11,
                family: "'Inter', 'Arial', sans-serif",
                weight: '500'
              },
              color: '#9ca3af',
              backdropColor: 'rgba(255, 255, 255, 0.95)',
              backdropPadding: 3,
              showLabelBackdrop: true
            },
            pointLabels: {
              font: {
                size: 12,
                family: "'Inter', 'Arial', sans-serif",
                weight: '300'
              },
              color: '#374151',
              padding: 8,
              callback: function(label) {
                // Wrap long labels
                if (label.length > 15) {
                  const words = label.split(' ');
                  if (words.length > 2) {
                    return [words.slice(0, 2).join(' '), words.slice(2).join(' ')];
                  }
                }
                return label;
              }
            },
            grid: {
              color: 'rgba(229, 231, 235, 0.8)',
              lineWidth: 1.5,
              circular: true
            },
            angleLines: {
              color: 'rgba(229, 231, 235, 0.8)',
              lineWidth: 1.5
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 13,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            padding: 10,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `Score: ${context.parsed.r}/10`;
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        }
      }
    });
  });

  // Update chart when values change
  $: if (chart) {
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].pointBackgroundColor = labels.map(label => CATEGORY_COLORS[label].hex);
    chart.data.datasets[0].pointHoverBorderColor = labels.map(label => CATEGORY_COLORS[label].hex);
    chart.update();
  }
</script>

<div class="p-3 bg-gradient-to-br from-gray-50 to-white rounded-lg">
  <div class="relative">
    <canvas bind:this={canvas} class="max-w-full h-auto"></canvas>
  </div>

  <div class="mt-3 space-y-2 px-1">
    <div class="text-xs text-gray-600 text-center pb-2 border-b border-gray-200">
      Total number of POIs: <span class="font-semibold">{amenities.length}</span>
    </div>
    
    {#each labels as label, i}
      <div class="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-1.5 min-w-[140px]">
          <div 
            class="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
            style="background-color: {CATEGORY_COLORS[label].hex};"
          ></div>
          <span class="text-xs font-medium text-gray-700">{label}</span>
        </div>
        <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div 
            class="h-full transition-all duration-500 ease-out rounded-full"
            style="width: {(values[i] / 10) * 100}%; background: linear-gradient(90deg, {CATEGORY_COLORS[label].hex}, {CATEGORY_COLORS[label].border});"
          ></div>
        </div>
        <div class="w-10 text-right tabular-nums text-xs font-semibold" style="color: {CATEGORY_COLORS[label].hex};">
          {values[i].toFixed(1)}
        </div>
      </div>
    {/each}
  </div>
</div>