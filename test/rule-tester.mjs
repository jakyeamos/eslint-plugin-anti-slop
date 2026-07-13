import { RuleTester } from "eslint";
import { describe, it } from "node:test";
import tsParser from "@typescript-eslint/parser";
import plugin from "../src/index.mjs";

RuleTester.afterAll = undefined;
RuleTester.describe = describe;
RuleTester.it = it;

export const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

export const tsTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

export const settings = {
  "anti-slop": {
    placeholderPatterns: ["coming soon", "todo", "tbd", "lorem ipsum", "placeholder"],
    marketingPatterns: ["powerful", "seamless", "unlock", "supercharge"],
    genericStatLabels: ["performance", "insights", "overview", "analytics", "usage", "activity"],
    actionWords: ["retry", "open", "create", "run", "fix", "clear filter"],
    demoDataModules: ["@/demo", "@/mocks", "@/fixtures"],
    realDataIndicators: ["fetch", "db", "prisma", "trpc"],
    clientOnlyImports: ["next/navigation", "@tanstack/react-query", "recharts"],
  },
};

export { plugin };
