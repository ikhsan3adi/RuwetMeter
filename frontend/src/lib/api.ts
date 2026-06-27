import type {
  CurrentMetrics,
  HistoryItem,
  AnomalyArticle,
  ChatResponse,
  ChatRequest,
} from './types'

const API_BASE = '/api/v1'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: { code: 'UNKNOWN', message: res.statusText } }))
    throw new Error(err.error?.message ?? 'Request failed')
  }
  return res.json()
}

export async function getCurrentMetrics(): Promise<CurrentMetrics> {
  return fetchJson<CurrentMetrics>('/metrics/current')
}

export async function getMetricsHistory(days = 7): Promise<HistoryItem[]> {
  return fetchJson<HistoryItem[]>(`/metrics/history?days=${days}`)
}

export async function getAnomalyArticles(): Promise<AnomalyArticle[]> {
  return fetchJson<AnomalyArticle[]>('/news/anomalies')
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  return fetchJson<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
