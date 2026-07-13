import { readFileSync } from "node:fs";
import { pluginRules, presetRules } from "./internal/rules/catalog.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    namespace: "anti-slop",
  },
  rules: pluginRules,
};

plugin.configs = {
  recommended: {
    plugins: {
      "anti-slop": plugin,
    },
    rules: presetRules("recommendedSeverity"),
  },
  strict: {
    plugins: {
      "anti-slop": plugin,
    },
    rules: presetRules("strictSeverity"),
  },
};

export default plugin;
