import type { ESLint, Linter, Rule } from "eslint";

declare const plugin: ESLint.Plugin & {
  meta: {
    name: string;
    version: string;
    namespace: "anti-slop";
  };
  rules: Record<string, Rule.RuleModule>;
  configs: {
    recommended: Linter.Config;
    strict: Linter.Config;
  };
};

export default plugin;
