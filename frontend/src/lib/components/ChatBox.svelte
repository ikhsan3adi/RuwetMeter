<script lang="ts">
  import { sendChatMessage } from '../api'
  import type { ChatResponse } from '../types'
  import MessageCircle from 'lucide-svelte/icons/message-circle'
  import Bot from 'lucide-svelte/icons/bot'
  import User from 'lucide-svelte/icons/user'
  import Send from 'lucide-svelte/icons/send'
  import Link from 'lucide-svelte/icons/link'
  import { marked } from 'marked'
  import { onMount } from 'svelte'

  interface Message {
    role: 'user' | 'assistant'
    text: string
    sources?: string[]
  }

  let messages: Message[] = $state([])
  let input: string = $state('')
  let loading = $state(false)
  let chatContainer: HTMLDivElement
  let dimensionFilter: 'economy' | 'politics' | 'infrastructure' | 'social' | undefined = $state(undefined)

  onMount(() => {
    const params = new URLSearchParams(window.location.search)
    const dim = params.get('dimension')
    if (dim && ['economy', 'politics', 'infrastructure', 'social'].includes(dim)) {
      dimensionFilter = dim as any
    }
  })

  function renderMarkdown(text: string): string {
    return marked.parse(text, { async: false }) as string
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    messages.push({ role: 'user', text })
    input = ''
    loading = true

    try {
      const res: ChatResponse = await sendChatMessage({
        message: text,
        dimensionFilter: dimensionFilter || undefined,
      })
      messages.push({ role: 'assistant', text: res.reply, sources: res.sources })
    } catch (err) {
      messages.push({
        role: 'assistant',
        text: err instanceof Error ? err.message : 'Gagal mendapatkan respons.',
      })
    } finally {
      loading = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  $effect(() => {
    if (chatContainer && messages.length > 0) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  })
</script>

<div class="glass-strong rounded-[2rem] border border-base-content/10 h-full flex flex-col overflow-hidden">
  <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" bind:this={chatContainer}>
    {#if messages.length === 0 && !loading}
      <div class="flex flex-col items-center justify-center h-full text-center gap-4">
        <div class="size-16 rounded-2xl bg-base-content/8 flex items-center justify-center">
          <MessageCircle class="size-7 text-base-content/40" stroke-width="1.5" />
        </div>
        <div>
          <p class="text-base-content/70 font-body text-sm font-medium">Tanya tentang sentimen publik</p>
          <p class="text-base-content/50 font-body text-xs mt-1">Berita terkini, kondisi sosial, politik Indonesia</p>
        </div>
      </div>
    {/if}
    {#each messages as msg, i}
      <div
        class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in"
        style="animation-delay: {i * 0.03}s"
      >
        {#if msg.role === 'assistant'}
          <div class="flex items-start gap-2.5 max-w-[88%] md:max-w-[72%]">
            <div class="size-7 rounded-full bg-base-content/8 flex items-center justify-center shrink-0 mt-1">
              <Bot class="size-3.5 text-base-content/50" />
            </div>
            <div class="rounded-2xl rounded-tl-sm bg-base-200 px-4 py-2.5 text-sm leading-relaxed font-body text-base-content markdown-body w-full">
              {@html renderMarkdown(msg.text)}
              {#if msg.sources && msg.sources.length > 0}
                <div class="mt-3 pt-2.5 border-t border-base-content/10 text-xs text-base-content/60 space-y-1 font-body">
                  <span class="font-semibold block text-base-content/70">Referensi Artikel:</span>
                  <div class="flex flex-col gap-1">
                    {#each msg.sources as src}
                      <a href={src} target="_blank" rel="noopener noreferrer" class="link hover:text-red-500/80 transition-colors flex items-center gap-1.5 truncate">
                        <Link class="size-3 shrink-0 text-base-content/40" />
                        <span class="truncate">{src}</span>
                      </a>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="flex items-start gap-2.5 max-w-[88%] md:max-w-[72%] flex-row-reverse">
            <div class="size-7 rounded-full bg-base-content/15 flex items-center justify-center shrink-0 mt-1">
              <User class="size-3.5 text-base-content/60" />
            </div>
            <div class="rounded-2xl rounded-tr-sm bg-base-content/10 px-4 py-2.5 text-sm leading-relaxed text-base-content/80 font-body">
              <p class="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        {/if}
      </div>
    {/each}
    {#if loading}
      <div class="flex justify-start animate-fade-in">
        <div class="flex items-start gap-2.5 max-w-[72%]">
          <div class="size-7 rounded-full bg-base-content/8 flex items-center justify-center shrink-0 mt-1">
            <Bot class="size-3.5 text-base-content/50" />
          </div>
          <div class="rounded-2xl rounded-tl-sm bg-base-200 px-4 py-3">
            <span class="loading loading-dots loading-sm text-base-content/60"></span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="border-t border-base-content/10 p-3 md:p-4 bg-base-100/50">
    <div class="flex flex-wrap gap-1.5 mb-3 max-w-4xl mx-auto px-1">
      <span class="text-xs text-base-content/40 self-center mr-1 font-heading uppercase tracking-wider font-semibold">Fokus:</span>
      {#each [
        { label: 'Semua', value: undefined },
        { label: 'Ekonomi', value: 'economy' },
        { label: 'Politik', value: 'politics' },
        { label: 'Infrastruktur', value: 'infrastructure' },
        { label: 'Sosial', value: 'social' }
      ] as dim}
        <button
          class="btn btn-xs rounded-full px-2.5 border-none font-body transition-all {dimensionFilter === dim.value ? 'bg-base-content/20 text-base-content font-bold' : 'bg-base-content/5 text-base-content/50 hover:bg-base-content/10 hover:text-base-content/70'}"
          onclick={() => { dimensionFilter = dim.value as any }}
          disabled={loading}
        >
          {dim.label}
        </button>
      {/each}
    </div>
    <div class="flex gap-2 items-end max-w-4xl mx-auto">
      <div class="flex-1 relative">
        <textarea
          class="textarea w-full resize-none text-sm font-body rounded-xl bg-base-200/70 focus:bg-base-200 min-h-[44px] max-h-32 py-3 px-4 leading-relaxed transition-colors text-base-content placeholder:text-base-content/40 border border-base-content/20"
          bind:value={input}
          onkeydown={handleKeydown}
          placeholder="Tanya sesuatu..."
          rows="1"
          disabled={loading}
        ></textarea>
      </div>
      <button
        class="btn rounded-xl min-h-[44px] px-4 bg-base-content/10 hover:bg-base-content/15 text-base-content/60 hover:text-base-content border-none"
        onclick={send}
        disabled={!input.trim() || loading}
      >
        {#if loading}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <Send class="size-4" />
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  :global(.markdown-body p) {
    margin-bottom: 0.5rem;
  }
  :global(.markdown-body p:last-child) {
    margin-bottom: 0;
  }
  :global(.markdown-body ul) {
    list-style-type: disc;
    margin-left: 1.25rem;
    margin-bottom: 0.5rem;
  }
  :global(.markdown-body ol) {
    list-style-type: decimal;
    margin-left: 1.25rem;
    margin-bottom: 0.5rem;
  }
  :global(.markdown-body li) {
    margin-bottom: 0.25rem;
  }
  :global(.markdown-body strong) {
    font-weight: 700;
  }
  :global(.markdown-body code) {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.06);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
  :global(.markdown-body pre) {
    background-color: rgba(0, 0, 0, 0.06);
    padding: 0.5rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 0.5rem;
  }
  :global(.markdown-body pre code) {
    background-color: transparent;
    padding: 0;
    font-size: 0.8125rem;
  }
  :global(.dark .markdown-body code),
  :global(.dark .markdown-body pre) {
    background-color: rgba(255, 255, 255, 0.1);
  }
</style>
