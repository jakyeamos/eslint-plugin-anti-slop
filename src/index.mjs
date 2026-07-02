import { noDemoDataPrimaryPathRule } from "./rules/no-demo-data-primary-path.mjs";
import { noDefensiveGuardSprawlRule } from "./rules/no-defensive-guard-sprawl.mjs";
import { noArbitraryZIndexRule } from "./rules/no-arbitrary-z-index.mjs";
import { noDecorativeGridBackgroundRule } from "./rules/no-decorative-grid-background.mjs";
import { noExcessiveRadiusRule } from "./rules/no-excessive-radius.mjs";
import { noGenericStatLabelRule } from "./rules/no-generic-stat-label.mjs";
import { noGradientTextRule } from "./rules/no-gradient-text.mjs";
import { noHiddenRevealDefaultRule } from "./rules/no-hidden-reveal-default.mjs";
import { noMarketingCopyRule } from "./rules/no-marketing-copy.mjs";
import { noNestedCardsRule } from "./rules/no-nested-cards.mjs";
import { noPlaceholderCopyRule } from "./rules/no-placeholder-copy.mjs";
import { noSideStripeAccentRule } from "./rules/no-side-stripe-accent.mjs";
import { noUnjustifiedUseClientRule } from "./rules/no-unjustified-use-client.mjs";
import { noUselessMemoRule } from "./rules/no-useless-memo.mjs";
import { requireEmptyStateActionRule } from "./rules/require-empty-state-action.mjs";
import { requireReducedMotionRule } from "./rules/require-reduced-motion.mjs";
import { ruleMetadata } from "./rule-metadata.mjs";

const plugin = {
  meta: {
    name: "eslint-plugin-anti-slop",
    version: "0.1.0",
  },
  rules: {
    "no-unjustified-use-client": noUnjustifiedUseClientRule,
    "no-useless-memo": noUselessMemoRule,
    "no-placeholder-copy": noPlaceholderCopyRule,
    "no-marketing-copy": noMarketingCopyRule,
    "require-empty-state-action": requireEmptyStateActionRule,
    "no-demo-data-primary-path": noDemoDataPrimaryPathRule,
    "no-defensive-guard-sprawl": noDefensiveGuardSprawlRule,
    "no-generic-stat-label": noGenericStatLabelRule,
    "no-gradient-text": noGradientTextRule,
    "no-decorative-grid-background": noDecorativeGridBackgroundRule,
    "no-side-stripe-accent": noSideStripeAccentRule,
    "no-excessive-radius": noExcessiveRadiusRule,
    "no-arbitrary-z-index": noArbitraryZIndexRule,
    "require-reduced-motion": requireReducedMotionRule,
    "no-hidden-reveal-default": noHiddenRevealDefaultRule,
    "no-nested-cards": noNestedCardsRule,
  },
};

plugin.configs = {
  recommended: {
    plugins: {
      "anti-slop": plugin,
    },
    rules: rulesForPreset("recommendedSeverity"),
  },
  strict: {
    plugins: {
      "anti-slop": plugin,
    },
    rules: rulesForPreset("strictSeverity"),
  },
};

function rulesForPreset(severityKey) {
  return Object.fromEntries(
    Object.entries(ruleMetadata).map(([ruleId, metadata]) => [ruleId, metadata[severityKey]]),
  );
}

export default plugin;
