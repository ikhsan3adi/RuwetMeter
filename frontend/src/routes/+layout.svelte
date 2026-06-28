<script lang="ts">
  import IndonesiaMap from '$lib/components/IndonesiaMap.svelte'
  import MessageCircle from 'lucide-svelte/icons/message-circle'
  import Moon from 'lucide-svelte/icons/moon'
  import Sun from 'lucide-svelte/icons/sun'
  import { onMount } from 'svelte'
  import '../app.css'

  let { children } = $props()

  let theme = $state('light')

  onMount(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      theme = 'dark'
    }
    document.documentElement.setAttribute('data-theme', theme)
  })

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
</script>

<IndonesiaMap
  class="fixed inset-0 w-full h-screen pointer-events-none select-none z-0"
  color={theme === 'light' ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.05)'}
  secondaryColor={theme === 'light' ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.1)'}
/>

<div class="gradient-subtle min-h-screen flex flex-col relative">
  <nav class="sticky top-0 z-50 border-b border-base-content/10 bg-base-100/70 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
      <a href="/" class="text-lg md:text-xl font-heading font-bold tracking-tight text-base-content">
        RuwetMeter
      </a>
      <div class="flex items-center gap-2">
        <button
          class="btn btn-ghost btn-sm btn-square rounded-full text-base-content/70 hover:text-base-content"
          onclick={toggleTheme}
          aria-label="Toggle theme"
        >
          {#if theme === 'light'}
            <Moon class="size-4" />
          {:else}
            <Sun class="size-4" />
          {/if}
        </button>
      </div>
    </div>
  </nav>

  <main class="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-8 transition-colors relative z-10">
    {@render children()}
  </main>

  <a
    href="/chat"
    class="btn btn-circle fixed bottom-6 right-6 z-40 size-14 transition-transform duration-300 hover:scale-110 active:scale-95 bg-base-content/10 hover:bg-base-content/15 text-base-content/60 hover:text-base-content border-none"
    aria-label="Chat"
  >
    <MessageCircle class="size-6" />
  </a>
</div>
