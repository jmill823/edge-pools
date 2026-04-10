import type { DisplayAdapter, ScoringType } from "../types";
import { toParDisplay } from "./to-par-display";
import { strokesDisplay } from "./strokes-display";
import { pointsDisplay } from "./points-display";

const displays: Record<ScoringType, DisplayAdapter> = {
  "to-par": toParDisplay,
  "total-strokes": strokesDisplay,
  "points": pointsDisplay,
};

export function getDisplayAdapter(type: ScoringType): DisplayAdapter {
  const adapter = displays[type];
  if (!adapter) throw new Error(`Unknown display adapter: ${type}`);
  return adapter;
}
