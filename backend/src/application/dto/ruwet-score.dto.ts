export interface RuwetScoreDto {
  timestamp: string;
  scores: {
    economy: number;
    politics: number;
    infrastructure: number;
    social: number;
  };
  total: number;
  summary: string;
}
