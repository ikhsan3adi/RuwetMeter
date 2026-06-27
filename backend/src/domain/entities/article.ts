export interface Article {
  id: string
  title: string
  url: string
  source: string
  content: string
  contentType: 'raw' | 'cleaned' | 'summary'
  publishedAt: Date
  fetchedAt: Date
}
