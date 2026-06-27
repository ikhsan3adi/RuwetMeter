<script lang="ts">
  import ArrowLeft from 'lucide-svelte/icons/arrow-left'
  import ChatBox from '../../lib/components/ChatBox.svelte'
</script>

<div class="animate-fade-in flex flex-col h-[calc(100vh-8rem)] min-h-[500px] relative">
  <div class="flex items-center gap-3 mb-4">
    <a href="/" class="btn btn-ghost btn-sm btn-square rounded-full shrink-0 text-base-content/70 hover:text-base-content" aria-label="Kembali ke Dashboard">
      <ArrowLeft class="size-4" />
    </a>
    <div>
      <h1 class="text-lg font-heading font-bold tracking-tight text-base-content">Chat</h1>
      <p class="text-xs text-base-content/70 font-body">Tanya tentang sentimen publik Indonesia</p>
    </div>
  </div>
  <div class="flex-1">
    <ChatBox />
  </div>
</div>
