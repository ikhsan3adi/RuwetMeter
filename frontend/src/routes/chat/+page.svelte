<script lang="ts">
  import ChatBox from "../../lib/components/ChatBox.svelte";
</script>

<h1>Chat</h1>
<p class="subtitle">
  Ask questions about current news, public sentiment, and social-political conditions in Indonesia.
</p>
<div class="chat-wrapper">
  <ChatBox />
</div>

<style>
  h1 {
    margin-bottom: 8px;
    font-size: 24px;
  }
  .subtitle {
    color: #64748b;
    margin-bottom: 20px;
    font-size: 14px;
  }
  .chat-wrapper {
    height: calc(100vh - 200px);
    min-height: 400px;
  }
</style>
