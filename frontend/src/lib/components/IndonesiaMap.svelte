<script lang="ts">
  let {
    class: className = '',
    color = '#b3b3b3',
    secondaryColor = '#e0e0e0',
  }: { class?: string; color?: string; secondaryColor?: string } = $props()
  let svgEl: SVGSVGElement | undefined = $state()
  let raw = $state('')

  $effect(() => {
    if (!raw) return
    const text = raw
      .replace(/#b3b3b3/g, color)
      .replace(/#e0e0e0/g, secondaryColor)
      .replace(/#f8f8f8/g, color)

    const div = document.createElement('div')
    div.innerHTML = text
    const svg = div.querySelector('svg')!
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice')
    svgEl = svg
  })

  $effect(() => {
    fetch('/indonesia-map.svg')
      .then((r) => r.text())
      .then((t) => { raw = t })
  })
</script>

<div class={className}>
  {#if svgEl}
    {@html svgEl.outerHTML}
  {/if}
</div>

<style>
  div :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
