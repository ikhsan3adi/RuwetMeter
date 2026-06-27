import type { AnalysisProviderPort, AnalysisResult } from "../../../application/ports/analysis-provider.port";
import type { ChatProviderPort, ChatResult } from "../../../application/ports/chat-provider.port";
import type { Article } from "../../../domain/entities/article";
import { config } from "../../../config";

const BASE_URL = "https://api.groq.com/openai/v1";

export class GroqAnalysisAdapter implements AnalysisProviderPort {
  constructor(_model?: string) {
    if (!config.GROQ_API_KEY) throw new Error("Groq API key not configured");
  }

  async analyze(_articles: Article[]): Promise<AnalysisResult> {
    throw new Error("Groq analysis adapter not yet implemented");
  }
}

export class GroqChatAdapter implements ChatProviderPort {
  constructor(_model?: string) {
    if (!config.GROQ_API_KEY) throw new Error("Groq API key not configured");
  }

  async respond(_context: string, _question: string): Promise<ChatResult> {
    throw new Error("Groq chat adapter not yet implemented");
  }
}
