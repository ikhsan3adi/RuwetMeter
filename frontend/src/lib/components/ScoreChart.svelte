<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import type { HistoryItem } from "../types";

  let { data = [], height = 300 }: { data: HistoryItem[]; height?: number } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function getColor(idx: number): string {
    const colors = [
      "rgb(239, 68, 68)",
      "rgb(59, 130, 246)",
      "rgb(34, 197, 94)",
      "rgb(234, 179, 8)",
    ];
    return colors[idx % colors.length];
  }

  function buildChart() {
    if (!canvas) return;
    if (chart) chart.destroy();

    const labels = data.map((d) => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit" });
    });

    const dimensions = ["economy", "politics", "infrastructure", "social"] as const;
    const datasets = dimensions.map((dim, i) => ({
      label: dim.charAt(0).toUpperCase() + dim.slice(1),
      data: data.map((d) => d.scores[dim]),
      borderColor: getColor(i),
      backgroundColor: getColor(i).replace("rgb", "rgba").replace(")", ", 0.1)"),
      tension: 0.3,
      fill: false,
    }));

    const totalDataset: Record<string, unknown> = {
      label: "Total",
      data: data.map((d) => d.total),
      borderColor: "rgb(107, 114, 128)",
      backgroundColor: "transparent",
      borderDash: [5, 5],
      tension: 0.3,
      fill: false,
    };
    datasets.push(totalDataset as any);

    chart = new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          y: { min: 0, max: 100, ticks: { stepSize: 20 } },
        },
      },
    });
  }

  $effect(() => {
    if (data.length > 0) buildChart();
  });

  onMount(() => {
    if (data.length > 0) buildChart();
    return () => chart?.destroy();
  });
</script>

<div class="chart-wrapper" style="height: {height}px">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-wrapper {
    width: 100%;
    position: relative;
  }
</style>
