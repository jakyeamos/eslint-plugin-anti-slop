import { noDemoDataPrimaryPathRule } from "./rules/no-demo-data-primary-path.mjs";
import { noDefensiveGuardSprawlRule } from "./rules/no-defensive-guard-sprawl.mjs";
import { noGenericStatLabelRule } from "./rules/no-generic-stat-label.mjs";
import { noMarketingCopyRule } from "./rules/no-marketing-copy.mjs";
import { noPlaceholderCopyRule } from "./rules/no-placeholder-copy.mjs";
import { noUnjustifiedUseClientRule } from "./rules/no-unjustified-use-client.mjs";
import { noUselessMemoRule } from "./rules/no-useless-memo.mjs";
import { requireEmptyStateActionRule } from "./rules/require-empty-state-action.mjs";

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
  },
};

plugin.configs = {
  recommended: {
    plugins: {
      "anti-slop": plugin,
    },
    rules: {
      "anti-slop/no-unjustified-use-client": "error",
      "anti-slop/no-useless-memo": "warn",
      "anti-slop/no-placeholder-copy": "error",
      "anti-slop/no-marketing-copy": "warn",
      "anti-slop/require-empty-state-action": "warn",
      "anti-slop/no-demo-data-primary-path": "error",
      "anti-slop/no-defensive-guard-sprawl": "warn",
      "anti-slop/no-generic-stat-label": "warn",
    },
  },
  strict: {
    plugins: {
      "anti-slop": plugin,
    },
    rules: {
      "anti-slop/no-unjustified-use-client": "error",
      "anti-slop/no-useless-memo": "error",
      "anti-slop/no-placeholder-copy": "error",
      "anti-slop/no-marketing-copy": "error",
      "anti-slop/require-empty-state-action": "error",
      "anti-slop/no-demo-data-primary-path": "error",
      "anti-slop/no-defensive-guard-sprawl": "error",
      "anti-slop/no-generic-stat-label": "error",
    },
  },
};

export default plugin;
