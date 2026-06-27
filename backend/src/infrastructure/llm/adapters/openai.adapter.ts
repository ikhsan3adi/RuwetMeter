import type { AnalysisProviderPort, AnalysisResult } from "../../../application/ports/analysis-provider.port";
import type { ChatProviderPort, ChatResult } from "../../../application/ports/chat-provider.port";
import type { EmbeddingProviderPort } from "../../../application/ports/embedding-provider.port";
import type { Article } from "../../../domain/entities/article";
import { config } from "../../../config";

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  response_format?: { type: "json_object" };
}

interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

interface ChatCompletionResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

interface EmbeddingResponse {
  data: Array<{
    index: number;
    embedding: number[];
  }>;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export class OpenAIAnalysisAdapter implements AnalysisProviderPort {
  private baseURL: string;
  private apiKey: string;
  private model: string;

  constructor(baseURL?: string, apiKey?: string, model?: string) {
    this.baseURL = baseURL ?? DEFAULT_BASE_URL;
    this.apiKey = apiKey ?? config.OPENAI_API_KEY;
    this.model = model ?? "gpt-4o";
    if (!this.apiKey) throw new Error("OpenAI API key not configured");
  }

  async analyze(articles: Article[]): Promise<AnalysisResult> {
    const content = articles
      .slice(0, 20)
      .map((a) => `[${a.source}] ${a.title}\n${a.content.slice(0, 2000)}`)
      .join("\n\n---\n\n");

    const body: ChatCompletionRequest = {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are a social-political analyst for Indonesia. Analyze the following news articles and return a JSON object with:\n" +
            "- economy: integer 0-100\n" +
            "- politics: integer 0-100\n" +
            "- infrastructure: integer 0-100\n" +
            "- social: integer 0-100\n" +
            "- summary: string (2-3 sentences in Indonesian describing the overall situation)\n\n" +
            "Higher score means more concerning/turbulent.",
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    };

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI analysis failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const parsed = JSON.parse(data.choices[0].message.content) as Record<string, unknown>;
    return {
      economy: (parsed.economy as number) ?? 0,
      politics: (parsed.politics as number) ?? 0,
      infrastructure: (parsed.infrastructure as number) ?? 0,
      social: (parsed.social as number) ?? 0,
      summary: (parsed.summary as string) ?? "",
    };
  }
}

export class OpenAIChatAdapter implements ChatProviderPort {
  private baseURL: string;
  private apiKey: string;
  private model: string;

  constructor(baseURL?: string, apiKey?: string, model?: string) {
    this.baseURL = baseURL ?? DEFAULT_BASE_URL;
    this.apiKey = apiKey ?? config.OPENAI_API_KEY;
    this.model = model ?? "gpt-4o-mini";
    if (!this.apiKey) throw new Error("OpenAI API key not configured");
  }

  async respond(context: string, question: string): Promise<ChatResult> {
    const body: ChatCompletionRequest = {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for RuwetMeter, an Indonesian public sentiment analysis system. " +
            "Answer questions based on the provided news context. Be concise and factual. " +
            "If the answer cannot be derived from the context, say so.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    };

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI chat failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    return {
      reply: data.choices[0].message.content,
      sourceUrls: [],
    };
  }
}

export class OpenAIEmbeddingAdapter implements EmbeddingProviderPort {
  private baseURL: string;
  private apiKey: string;
  private model: string;

  constructor(baseURL?: string, apiKey?: string, model?: string) {
    this.baseURL = baseURL ?? DEFAULT_BASE_URL;
    this.apiKey = apiKey ?? config.OPENAI_API_KEY;
    this.model = model ?? "text-embedding-3-small";
    if (!this.apiKey) throw new Error("OpenAI API key not configured");
  }

  async embed(text: string): Promise<number[]> {
    const [result] = await this.embedBatch([text]);
    return result;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const body: EmbeddingRequest = {
      model: this.model,
      input: texts,
    };

    const res = await fetch(`${this.baseURL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embedding failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as EmbeddingResponse;
    return data.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}
