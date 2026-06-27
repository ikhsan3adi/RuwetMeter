import type { AnalysisProviderPort, AnalysisResult } from "../../../application/ports/analysis-provider.port";
import type { ChatProviderPort, ChatResult } from "../../../application/ports/chat-provider.port";
import type { Article } from "../../../domain/entities/article";
import { config } from "../../../config";

export class MistralAnalysisAdapter implements AnalysisProviderPort {
  constructor(_model?: string) {
    if (!config.MISTRAL_API_KEY) throw new Error("Mistral API key not configured");
  }

  async analyze(_articles: Article[]): Promise<AnalysisResult> {
    throw new Error("Mistral analysis adapter not yet implemented");
  }
}

export class MistralChatAdapter implements ChatProviderPort {
  constructor(_model?: string) {
    if (!config.MISTRAL_API_KEY) throw new Error("Mistral API key not configured");
  }

  async respond(_context: string, _question: string): Promise<ChatResult> {
    throw new Error("Mistral chat adapter not yet implemented");
  }
}
