export interface MetricsScore {
  economy: number;
  politics: number;
  infrastructure: number;
  social: number;
}

export interface CurrentMetrics {
  timestamp: string;
  scores: MetricsScore;
  total: number;
  summary: string;
}

export interface HistoryItem {
  timestamp: string;
  scores: MetricsScore;
  total: number;
}

export interface AnomalyArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  reply: string;
  sources: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
