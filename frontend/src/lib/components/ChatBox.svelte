<script lang="ts">
  import { sendChatMessage } from '../api'
  import type { ChatResponse } from '../types'
  import MessageCircle from 'lucide-svelte/icons/message-circle'
  import Bot from 'lucide-svelte/icons/bot'
  import User from 'lucide-svelte/icons/user'
  import Send from 'lucide-svelte/icons/send'

  interface Message {
    role: 'user' | 'assistant'
    text: string
  }

  let messages: Message[] = $state([])
  let input: string = $state('')
  let loading = $state(false)
  let chatContainer: HTMLDivElement

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    messages.push({ role: 'user', text })
    input = ''
    loading = true

    try {
      const res: ChatResponse = await sendChatMessage({ message: text })
      messages.push({ role: 'assistant', text: res.reply })
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
            <div class="rounded-2xl rounded-tl-sm bg-base-200 px-4 py-2.5 text-sm leading-relaxed font-body text-base-content">
              <p class="whitespace-pre-wrap">{msg.text}</p>
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
