ALTER TABLE ruwet_logs
  ADD CONSTRAINT chk_score_economy CHECK (score_economy BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_score_politics CHECK (score_politics BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_score_infrastructure CHECK (score_infrastructure BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_score_social CHECK (score_social BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_total_score CHECK (total_score BETWEEN 0 AND 100);
