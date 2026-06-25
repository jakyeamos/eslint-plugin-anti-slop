export const ruleMetadata = {
  "anti-slop/no-unjustified-use-client": {
    category: "Architecture",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Remove the directive or add real client-only behavior.",
  },
  "anti-slop/no-useless-memo": {
    category: "Maintainability",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Remove trivial memoization or justify a memo-sensitive boundary.",
  },
  "anti-slop/no-placeholder-copy": {
    category: "UX",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Replace placeholder copy with real product text.",
  },
  "anti-slop/no-marketing-copy": {
    category: "UX",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Replace generic marketing language with specific workflow copy.",
  },
  "anti-slop/require-empty-state-action": {
    category: "UX",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Add an explicit empty-state action or action wording.",
  },
  "anti-slop/no-demo-data-primary-path": {
    category: "Data integrity",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Use real data in primary routes or move demo data off the main path.",
  },
  "anti-slop/no-defensive-guard-sprawl": {
    category: "Maintainability",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Move repeated shape checks into a centralized validator or type guard.",
  },
  "anti-slop/no-generic-stat-label": {
    category: "UX",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Use domain-specific metric labels.",
  },
};

export function metadataForRule(ruleId) {
  return ruleMetadata[ruleId] ?? {
    category: "Quality",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Fix the anti-slop rule violation before committing.",
  };
}
