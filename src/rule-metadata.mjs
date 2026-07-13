export const ruleMetadata = {
  "anti-slop/no-unjustified-use-client": {
    category: "Architecture",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Review the client boundary; remove the directive only after confirming no client-only behavior remains.",
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
    requiredFix: "Add action wording or a usable enabled control within the local empty-state boundary.",
  },
  "anti-slop/no-demo-data-primary-path": {
    category: "Data integrity",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Use real data in primary routes or restrict demo data to a nullish fallback for an immutable same-scope real-data result.",
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
  "anti-slop/no-gradient-text": {
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Replace gradient-clipped text with a solid text color and clearer hierarchy.",
  },
  "anti-slop/no-decorative-grid-background": {
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Remove decorative CSS grid backgrounds unless the surface is an actual canvas, map, or measurement tool.",
  },
  "anti-slop/no-side-stripe-accent": {
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Replace thick side-stripe accents with full borders, icons, or background contrast.",
  },
  "anti-slop/no-excessive-radius": {
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Use the project radius scale instead of oversized card or panel radii.",
  },
  "anti-slop/no-arbitrary-z-index": {
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Use a semantic z-index token or scale.",
  },
  "anti-slop/require-reduced-motion": {
    category: "Accessibility",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Add a type-matched reduced-motion fallback for each static animation or transition.",
  },
  "anti-slop/no-hidden-reveal-default": {
    category: "Accessibility",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Keep content visible by default and layer reveal motion on top.",
  },
  "anti-slop/no-nested-cards": {
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Flatten nested cards into sections or a simpler hierarchy.",
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
