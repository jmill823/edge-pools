import type { RosterRule, RosterRuleType } from "../types";
import { allPlayRule } from "./all-play";
import { bestOfRule } from "./best-of";
import { dropWorstRule } from "./drop-worst";

const rules: Record<RosterRuleType, RosterRule> = {
  "all-play": allPlayRule,
  "best-of": bestOfRule,
  "drop-worst": dropWorstRule,
};

export function getRosterRule(type: RosterRuleType): RosterRule {
  const rule = rules[type];
  if (!rule) throw new Error(`Unknown roster rule: ${type}`);
  return rule;
}
