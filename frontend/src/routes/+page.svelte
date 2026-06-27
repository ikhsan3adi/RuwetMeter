<script lang="ts">
  import { onMount } from "svelte";
  import { getCurrentMetrics, getMetricsHistory } from "../lib/api";
  import ScoreChart from "../lib/components/ScoreChart.svelte";
  import type { CurrentMetrics, HistoryItem } from "../lib/types";

  let current: CurrentMetrics | null = $state(null);
  let history: HistoryItem[] = $state([]);
  let loading = $state(true);
  let days = $state(7);

  async function loadData() {
    loading = true;
    try {
      const [c, h] = await Promise.all([
        getCurrentMetrics().catch(() => null),
        getMetricsHistory(days),
      ]);
      current = c;
      history = h;
    } catch {
      current = null;
      history = [];
    } finally {
      loading = false;
    }
  }

  onMount(loadData);

  function getScoreBars(c: typeof current) {
    if (!c) return [];
    return [
      { label: "Economy", value: c.scores.economy, color: "#ef4444" },
      { label: "Politics", value: c.scores.politics, color: "#3b82f6" },
      { label: "Infrastructure", value: c.scores.infrastructure, color: "#22c55e" },
      { label: "Social", value: c.scores.social, color: "#eab308" },
    ];
  }
  const scoreBars = $derived(getScoreBars(current));
</script>

<h1>Dashboard</h1>

{#if loading}
  <p class="loading">Loading data...</p>
{:else}
  <div class="summary-row">
    {#if current}
      <div class="total-card">
        <span class="total-label">Ruwet Level</span>
        <span class="total-value" class:high={current.total >= 60} class:medium={current.total >= 30 && current.total < 60}>
          {current.total}
        </span>
        <span class="total-sub">/ 100</span>
      </div>
      <div class="score-bars">
        {#each scoreBars as bar}
          <div class="bar-item">
            <span class="bar-label">{bar.label}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                style="width: {bar.value}%; background: {bar.color}"
              ></div>
            </div>
            <span class="bar-value">{bar.value}</span>
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-data">No data available yet. The system will collect data on the next aggregation cycle.</p>
    {/if}
  </div>

  {#if current?.summary}
    <div class="summary-box">
      <h3>Summary</h3>
      <p>{current.summary}</p>
    </div>
  {/if}

  <div class="chart-section">
    <div class="chart-header">
      <h3>Historical Trend</h3>
      <select bind:value={days} onchange={loadData}>
        <option value={3}>3 days</option>
        <option value={7}>7 days</option>
        <option value={14}>14 days</option>
        <option value={30}>30 days</option>
      </select>
    </div>
    <ScoreChart data={history} height={350} />
  </div>
{/if}

<style>
  h1 {
    margin-bottom: 20px;
    font-size: 24px;
  }
  .loading {
    color: #64748b;
    text-align: center;
    padding: 40px;
  }
  .no-data {
    color: #94a3b8;
    text-align: center;
    padding: 40px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  .summary-row {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
  }
  .total-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 160px;
    padding: 24px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  .total-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
  }
  .total-value {
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
    margin: 8px 0;
  }
  .total-value.high {
    color: #ef4444;
  }
  .total-value.medium {
    color: #eab308;
  }
  .total-sub {
    font-size: 14px;
    color: #94a3b8;
  }
  .score-bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
  }
  .bar-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bar-label {
    width: 110px;
    font-size: 13px;
    color: #475569;
  }
  .bar-track {
    flex: 1;
    height: 12px;
    background: #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.5s ease;
  }
  .bar-value {
    width: 28px;
    font-size: 13px;
    font-weight: 600;
    text-align: right;
  }
  .summary-box {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 24px;
  }
  .summary-box h3 {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 8px;
  }
  .summary-box p {
    font-size: 14px;
    line-height: 1.6;
    color: #334155;
  }
  .chart-section {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
  }
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .chart-header h3 {
    font-size: 16px;
  }
  select {
    padding: 6px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
    background: #fff;
  }
</style>
