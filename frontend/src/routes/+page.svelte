<script lang="ts">
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3'
  import { onMount } from 'svelte'
  import { getCurrentMetrics, getMetricsHistory } from '../lib/api'
  import ScoreChart from '../lib/components/ScoreChart.svelte'
  import type { CurrentMetrics, HistoryItem } from '../lib/types'

  let current: CurrentMetrics | null = $state(null)
  let history: HistoryItem[] = $state([])
  let loading = $state(true)
  let days = $state(7)

  async function loadData() {
    loading = true
    try {
      const [c, h] = await Promise.all([
        getCurrentMetrics().catch(() => null),
        getMetricsHistory(days),
      ])
      current = c
      history = h
    } catch {
      current = null
      history = []
    } finally {
      loading = false
    }
  }

  onMount(loadData)

  function getScoreBars(c: typeof current) {
    if (!c) return []
    return [
      { label: 'Ekonomi', value: c.scores.economy },
      { label: 'Politik', value: c.scores.politics },
      { label: 'Infrastruktur', value: c.scores.infrastructure },
      { label: 'Sosial', value: c.scores.social },
    ]
  }

  function isHigh(v: number) { return v >= 70 }

  const scoreBars = $derived(getScoreBars(current))
</script>

<div class="animate-fade-in">
  {#if loading}
    <div class="flex justify-center py-32">
      <span class="loading loading-spinner loading-lg text-base-content/20"></span>
    </div>
  {:else if current}
    <div class="text-center py-8 md:py-10 animate-slide-up">
      <p class="text-xl font-bold uppercase tracking-[0.2em] text-base-content/60 font-heading mb-3">Indeks Ruwet</p>
      <p class="text-8xl md:text-[10rem] font-bold leading-none font-body tracking-tight {isHigh(current.total) ? 'text-red-500/80' : 'text-base-content'}">
        {current.total}
        <span class="text-2xl md:text-4xl font-medium text-base-content/25 font-body align-top md:align-super">/100</span>
      </p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-slide-up" style="animation-delay: 0.08s">
      {#each scoreBars as bar}
        <div class="glass rounded-2xl border border-base-content/10 p-5 text-center">
          <p class="text-xs font-semibold text-base-content/70 font-heading uppercase tracking-wider mb-2">{bar.label}</p>
          <p class="text-2xl md:text-3xl font-bold font-body {isHigh(bar.value) ? 'text-red-500/80' : 'text-base-content'}">{bar.value}</p>
          <div class="mt-3 h-2 rounded-full bg-base-content/8 overflow-hidden">
            <div class="h-full rounded-full {isHigh(bar.value) ? 'bg-red-500/40' : 'bg-base-content/20'} transition-all duration-700 ease-out" style="width: {bar.value}%"></div>
          </div>
        </div>
      {/each}
    </div>

    {#if current.summary}
      <div class="glass rounded-2xl border border-base-content/10 border-l-4 border-l-base-content/20 p-5 md:p-6 mb-6 animate-slide-up" style="animation-delay: 0.12s">
        <p class="font-heading font-bold text-lg tracking-tight text-base-content mb-2">Ringkasan</p>
        <p class="text-sm leading-relaxed text-base-content font-body">{current.summary}</p>
      </div>
    {/if}

    <div class="glass rounded-2xl border border-base-content/10 p-5 md:p-6 animate-slide-up" style="animation-delay: 0.16s">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h3 class="font-heading font-bold text-lg tracking-tight text-base-content">Tren Historis</h3>
        <select class="select select-sm rounded-xl bg-base-200/70 text-base-content font-body border border-base-content/20" bind:value={days} onchange={loadData}>
          <option value={3}>3 hari</option>
          <option value={7}>7 hari</option>
          <option value={14}>14 hari</option>
          <option value={30}>30 hari</option>
        </select>
      </div>
      <ScoreChart data={history} height={320} />
    </div>
  {:else}
    <div class="glass rounded-2xl border border-base-content/10 py-24 text-center animate-fade-in">
      <div class="text-base-content/30 mb-4">
        <BarChart3 class="size-16 mx-auto" stroke-width="1.5" />
      </div>
      <p class="text-base-content/70 font-body text-sm">Belum ada data. Sistem akan mengumpulkan data pada siklus agregasi berikutnya.</p>
    </div>
  {/if}
</div>
