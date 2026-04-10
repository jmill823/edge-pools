import type { ScoringStrategy, ScoringType } from "../types";
import { toParStrategy } from "./to-par";
import { totalStrokesStrategy } from "./total-strokes";
import { pointsStrategy } from "./points";

const strategies: Record<ScoringType, ScoringStrategy> = {
  "to-par": toParStrategy,
  "total-strokes": totalStrokesStrategy,
  "points": pointsStrategy,
};

export function getStrategy(type: ScoringType): ScoringStrategy {
  const strategy = strategies[type];
  if (!strategy) throw new Error(`Unknown scoring type: ${type}`);
  return strategy;
}
