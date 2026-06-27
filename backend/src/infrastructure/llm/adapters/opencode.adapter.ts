import type { AnalysisProviderPort, AnalysisResult } from "../../../application/ports/analysis-provider.port";
import type { ChatProviderPort, ChatResult } from "../../../application/ports/chat-provider.port";
import { config } from "../../../config";
import type { Article } from "../../../domain/entities/article";
import {
  OpenAIAnalysisAdapter,
  OpenAIChatAdapter,
} from "./openai.adapter";

const BASE_URL = 'https://opencode.ai/zen/v1';

export class OpencodeAnalysisAdapter implements AnalysisProviderPort {
  private inner: OpenAIAnalysisAdapter;

  constructor(model?: string) {
    this.inner = new OpenAIAnalysisAdapter(
      BASE_URL,
      config.OPENCODE_API_KEY,
      model ?? "big-pickle",
    );
  }

  analyze(articles: Article[]): Promise<AnalysisResult> {
    return this.inner.analyze(articles);
  }
}

export class OpencodeChatAdapter implements ChatProviderPort {
  private inner: OpenAIChatAdapter;

  constructor(model?: string) {
    this.inner = new OpenAIChatAdapter(
      BASE_URL,
      config.OPENCODE_API_KEY,
      model ?? "big-pickle",
    );
  }

  respond(context: string, question: string): Promise<ChatResult> {
    return this.inner.respond(context, question);
  }
}
