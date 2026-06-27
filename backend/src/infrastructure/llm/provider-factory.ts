import type { AnalysisProviderPort } from "../../application/ports/analysis-provider.port";
import type { ChatProviderPort } from "../../application/ports/chat-provider.port";
import type { EmbeddingProviderPort } from "../../application/ports/embedding-provider.port";
import { config } from "../../config";

import { OpenAIAnalysisAdapter, OpenAIChatAdapter, OpenAIEmbeddingAdapter } from "./adapters/openai.adapter";
import { AnthropicAnalysisAdapter, AnthropicChatAdapter } from "./adapters/anthropic.adapter";
import { GoogleAnalysisAdapter, GoogleChatAdapter, GoogleEmbeddingAdapter } from "./adapters/google.adapter";
import { OpenRouterAnalysisAdapter, OpenRouterChatAdapter, OpenRouterEmbeddingAdapter } from "./adapters/openrouter.adapter";
import { DeepSeekAnalysisAdapter, DeepSeekChatAdapter } from "./adapters/deepseek.adapter";
import { MistralAnalysisAdapter, MistralChatAdapter } from "./adapters/mistral.adapter";
import { GroqAnalysisAdapter, GroqChatAdapter } from "./adapters/groq.adapter";
import { OpencodeAnalysisAdapter, OpencodeChatAdapter } from "./adapters/opencode.adapter";

export function createAnalysisProvider(): AnalysisProviderPort {
  switch (config.ANALYSIS_PROVIDER) {
    case "anthropic":
      return new AnthropicAnalysisAdapter();
    case "openai":
      return new OpenAIAnalysisAdapter();
    case "google":
      return new GoogleAnalysisAdapter();
    case "openrouter":
      return new OpenRouterAnalysisAdapter();
    case "deepseek":
      return new DeepSeekAnalysisAdapter();
    case "mistral":
      return new MistralAnalysisAdapter();
    case "groq":
      return new GroqAnalysisAdapter();
    case "opencode":
      return new OpencodeAnalysisAdapter();
    default:
      throw new Error(`Unknown analysis provider: ${config.ANALYSIS_PROVIDER}`);
  }
}

export function createChatProvider(): ChatProviderPort {
  switch (config.CHAT_PROVIDER) {
    case "anthropic":
      return new AnthropicChatAdapter();
    case "openai":
      return new OpenAIChatAdapter();
    case "google":
      return new GoogleChatAdapter();
    case "openrouter":
      return new OpenRouterChatAdapter();
    case "deepseek":
      return new DeepSeekChatAdapter();
    case "mistral":
      return new MistralChatAdapter();
    case "groq":
      return new GroqChatAdapter();
    case "opencode":
      return new OpencodeChatAdapter();
    default:
      throw new Error(`Unknown chat provider: ${config.CHAT_PROVIDER}`);
  }
}

export function createEmbeddingProvider(): EmbeddingProviderPort {
  switch (config.EMBEDDING_PROVIDER) {
    case "openai":
      return new OpenAIEmbeddingAdapter();
    case "google":
      return new GoogleEmbeddingAdapter();
    case "openrouter":
      return new OpenRouterEmbeddingAdapter();
    case "opencode":
      throw new Error("OpenCode Zen does not support embeddings. Use openai, google, or openrouter for embeddings.");
    default:
      throw new Error(
        `Unknown or unsupported embedding provider: ${config.EMBEDDING_PROVIDER}. ` +
        "Supported: openai, google, openrouter",
      );
  }
}
