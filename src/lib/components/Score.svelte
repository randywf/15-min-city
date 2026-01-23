<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  let canvas: HTMLCanvasElement;
  let chart: Chart<"radar">;

  const labels = ["Mobility & Parking", "Healthcare", "Education", "Other", "Entertainment" , "Food & Beverage"];

  // slider values (1..10)
  let values: number[] = [2.7, 3.8, 4.6, 2.2, 3.2, 4.2];

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

  // whenever "values" changes, update the chart
  $: if (chart) {
    chart.data.datasets[0].data = values;
    chart.update();
  }

  function setValue(i: number, v: number) {
    // create a new array so Svelte sees a change
    values = values.map((x, idx) => (idx === i ? v : x));
  }
</script>

<div class="p-4">
  <canvas bind:this={canvas} width="100" height="100"></canvas>

  <div class="mt-4 space-y-3">
    {#each labels as label, i}
      <div class="flex items-center gap-3">
        <div class="w-32 text-sm">{label}</div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.1"
          value={values[i]}
          on:input={(e) => setValue(i, +(e.currentTarget as HTMLInputElement).value)}
          class="flex-1"
        />
        <div class="w-12 text-right tabular-nums">{values[i].toFixed(1)}</div>
      </div>
    {/each}
  </div>
</div>