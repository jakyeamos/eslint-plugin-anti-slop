import { noArbitraryZIndexRule } from "../../rules/no-arbitrary-z-index.mjs";
import { noDecorativeGridBackgroundRule } from "../../rules/no-decorative-grid-background.mjs";
import { noDefensiveGuardSprawlRule } from "../../rules/no-defensive-guard-sprawl.mjs";
import { noDemoDataPrimaryPathRule } from "../../rules/no-demo-data-primary-path.mjs";
import { noExcessiveRadiusRule } from "../../rules/no-excessive-radius.mjs";
import { noGenericStatLabelRule } from "../../rules/no-generic-stat-label.mjs";
import { noGradientTextRule } from "../../rules/no-gradient-text.mjs";
import { noHiddenRevealDefaultRule } from "../../rules/no-hidden-reveal-default.mjs";
import { noMarketingCopyRule } from "../../rules/no-marketing-copy.mjs";
import { noNestedCardsRule } from "../../rules/no-nested-cards.mjs";
import { noPlaceholderCopyRule } from "../../rules/no-placeholder-copy.mjs";
import { noSideStripeAccentRule } from "../../rules/no-side-stripe-accent.mjs";
import { noUnjustifiedUseClientRule } from "../../rules/no-unjustified-use-client.mjs";
import { noUselessMemoRule } from "../../rules/no-useless-memo.mjs";
import { requireEmptyStateActionRule } from "../../rules/require-empty-state-action.mjs";
import { requireReducedMotionRule } from "../../rules/require-reduced-motion.mjs";

const RULE_NAMESPACE = "anti-slop";
const RULE_DOCUMENTATION_BASE_URL = "https://github.com/jakyeamos/eslint-plugin-anti-slop/blob/main/docs/rules";
const catalogEntries = [
  {
    ruleName: "no-unjustified-use-client",
    rule: noUnjustifiedUseClientRule,
    metadata: {
      category: "Architecture",
      recommendedSeverity: "error",
      strictSeverity: "error",
      requiredFix: "Review the client boundary; remove the directive only after confirming no client-only behavior remains.",
    },
  },
  {
    ruleName: "no-useless-memo",
    rule: noUselessMemoRule,
    metadata: {
      category: "Maintainability",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Remove trivial memoization or justify a memo-sensitive boundary.",
    },
  },
  {
    ruleName: "no-placeholder-copy",
    rule: noPlaceholderCopyRule,
    metadata: {
      category: "UX",
      recommendedSeverity: "error",
      strictSeverity: "error",
      requiredFix: "Replace placeholder copy with real product text.",
    },
  },
  {
    ruleName: "no-marketing-copy",
    rule: noMarketingCopyRule,
    metadata: {
      category: "UX",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Replace generic marketing language with specific workflow copy.",
    },
  },
  {
    ruleName: "require-empty-state-action",
    rule: requireEmptyStateActionRule,
    metadata: {
      category: "UX",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Add action wording or a usable enabled control within the local empty-state boundary.",
    },
  },
  {
    ruleName: "no-demo-data-primary-path",
    rule: noDemoDataPrimaryPathRule,
    metadata: {
      category: "Data integrity",
      recommendedSeverity: "error",
      strictSeverity: "error",
      requiredFix: "Use real data in primary routes or restrict demo data to a nullish fallback for an immutable same-scope real-data result.",
    },
  },
  {
    ruleName: "no-defensive-guard-sprawl",
    rule: noDefensiveGuardSprawlRule,
    metadata: {
      category: "Maintainability",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Move repeated shape checks into a centralized validator or type guard.",
    },
  },
  {
    ruleName: "no-generic-stat-label",
    rule: noGenericStatLabelRule,
    metadata: {
      category: "UX",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Use domain-specific metric labels.",
    },
  },
  {
    ruleName: "no-gradient-text",
    rule: noGradientTextRule,
    metadata: {
      category: "UI structure",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Replace gradient-clipped text with a solid text color and clearer hierarchy.",
    },
  },
  {
    ruleName: "no-decorative-grid-background",
    rule: noDecorativeGridBackgroundRule,
    metadata: {
      category: "UI structure",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Remove decorative CSS grid backgrounds unless the surface is an actual canvas, map, or measurement tool.",
    },
  },
  {
    ruleName: "no-side-stripe-accent",
    rule: noSideStripeAccentRule,
    metadata: {
      category: "UI structure",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Replace thick side-stripe accents with full borders, icons, or background contrast.",
    },
  },
  {
    ruleName: "no-excessive-radius",
    rule: noExcessiveRadiusRule,
    metadata: {
      category: "UI structure",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Use the project radius scale instead of oversized card or panel radii.",
    },
  },
  {
    ruleName: "no-arbitrary-z-index",
    rule: noArbitraryZIndexRule,
    metadata: {
      category: "UI structure",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Use a semantic z-index token or scale.",
    },
  },
  {
    ruleName: "require-reduced-motion",
    rule: requireReducedMotionRule,
    metadata: {
      category: "Accessibility",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Add a type-matched reduced-motion fallback for each static animation or transition.",
    },
  },
  {
    ruleName: "no-hidden-reveal-default",
    rule: noHiddenRevealDefaultRule,
    metadata: {
      category: "Accessibility",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Keep content visible by default and layer reveal motion on top.",
    },
  },
  {
    ruleName: "no-nested-cards",
    rule: noNestedCardsRule,
    metadata: {
      category: "UI structure",
      recommendedSeverity: "warn",
      strictSeverity: "error",
      requiredFix: "Flatten nested cards into sections or a simpler hierarchy.",
    },
  },
];

export const ruleCatalog = catalogEntries.map(({ ruleName, rule, metadata }) => {
  const docsUrl = `${RULE_DOCUMENTATION_BASE_URL}/${ruleName}.md`;
  return {
    ruleId: `${RULE_NAMESPACE}/${ruleName}`,
    ruleName,
    docsUrl,
    rule: withDocumentationUrl(rule, docsUrl),
    metadata,
  };
});

export const pluginRules = Object.fromEntries(
  ruleCatalog.map(({ ruleName, rule }) => [ruleName, rule]),
);

export const metadataByRuleId = Object.fromEntries(
  ruleCatalog.map(({ ruleId, metadata }) => [ruleId, metadata]),
);

export function metadataForCatalogRule(ruleId) {
  return metadataByRuleId[ruleId] ?? unknownRuleMetadata();
}

export function presetRules(severityKey) {
  return Object.fromEntries(
    ruleCatalog.map(({ ruleId, metadata }) => [ruleId, metadata[severityKey]]),
  );
}

export function sarifRuleDescriptors() {
  return ruleCatalog.map(({ ruleId, ruleName, metadata }) => ({
    id: ruleId,
    name: ruleName,
    shortDescription: { text: metadata.requiredFix },
    properties: {
      category: metadata.category,
      recommendedSeverity: metadata.recommendedSeverity,
    },
  }));
}

function unknownRuleMetadata() {
  return {
    category: "Quality",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Fix the anti-slop rule violation before committing.",
  };
}

function withDocumentationUrl(rule, docsUrl) {
  return {
    ...rule,
    meta: {
      ...rule.meta,
      docs: {
        ...rule.meta.docs,
        url: docsUrl,
      },
    },
  };
}
