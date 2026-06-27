export interface RawArticle {
  title: string;
  url: string;
  source: string;
  content: string;
  publishedAt: Date;
}

export interface RssFetcherPort {
  fetchAll(): Promise<RawArticle[]>;
}
