<script lang="ts">
  import { sendChatMessage } from "../api";
  import type { ChatResponse } from "../types";

  interface Message {
    role: "user" | "assistant";
    text: string;
  }

  let messages: Message[] = $state([]);
  let input: string = $state("");
  let loading = $state(false);
  let chatContainer: HTMLDivElement;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    messages.push({ role: "user", text });
    input = "";
    loading = true;

    try {
      const res: ChatResponse = await sendChatMessage({ message: text });
      messages.push({ role: "assistant", text: res.reply });
    } catch (err) {
      messages.push({
        role: "assistant",
        text: err instanceof Error ? err.message : "Failed to get response.",
      });
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  $effect(() => {
    if (chatContainer && messages.length > 0) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });
</script>

<div class="chat-container">
  <div class="messages" bind:this={chatContainer}>
    {#if messages.length === 0}
      <p class="placeholder">Ask about current news and public sentiment in Indonesia.</p>
    {/if}
    {#each messages as msg}
      <div class="message {msg.role}">
        <div class="bubble">{msg.text}</div>
      </div>
    {/each}
    {#if loading}
      <div class="message assistant">
        <div class="bubble typing">Thinking...</div>
      </div>
    {/if}
  </div>
  <div class="input-row">
    <textarea
      bind:value={input}
      onkeydown={handleKeydown}
      placeholder="Ask a question..."
      rows="1"
      disabled={loading}
    ></textarea>
    <button onclick={send} disabled={!input.trim() || loading}>
      Send
    </button>
  </div>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .placeholder {
    color: #9ca3af;
    text-align: center;
    margin: auto;
  }
  .message {
    display: flex;
  }
  .message.user {
    justify-content: flex-end;
  }
  .bubble {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .user .bubble {
    background: #3b82f6;
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .assistant .bubble {
    background: #f3f4f6;
    color: #111827;
    border-bottom-left-radius: 4px;
  }
  .typing {
    opacity: 0.6;
  }
  .input-row {
    display: flex;
    border-top: 1px solid #e5e7eb;
    padding: 8px;
    gap: 8px;
  }
  textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    padding: 8px;
    font-size: 14px;
    border-radius: 6px;
    background: #f9fafb;
  }
  button {
    padding: 8px 20px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
