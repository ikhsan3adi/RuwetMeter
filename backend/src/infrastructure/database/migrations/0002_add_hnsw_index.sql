CREATE INDEX idx_articles_embedding ON news_articles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
