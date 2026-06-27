import type { ScoreDimension } from "../value-objects/score-dimension";

export interface RuwetScore {
  id: string;
  createdAt: Date;
  economy: ScoreDimension;
  politics: ScoreDimension;
  infrastructure: ScoreDimension;
  social: ScoreDimension;
  totalScore: number;
  aiSummary: string;
  flagged: boolean;
  sourceArticleIds: string[];
}
