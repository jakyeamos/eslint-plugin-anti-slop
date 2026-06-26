import tsParser from "@typescript-eslint/parser";
import antiSlop from "./index.mjs";

export const antiSlopAuditFormatter = "./node_modules/eslint-plugin-anti-slop/audit-formatter.mjs";

export const aiosAuditArtifacts = Object.freeze([
  ".aios/audit/gate-events.jsonl",
  ".aios/audit/gate-summary.md",
  ".aios/audit/learning-lessons.md",
]);

export const defaultAntiSlopAuditIgnores = Object.freeze([
  "**/.next/**",
  "**/build/**",
  "**/coverage/**",
  "**/dist/**",
  "**/node_modules/**",
]);

export function antiSlopAiosAuditConfig({ ignores = [] } = {}) {
  const recommended = antiSlop.configs.recommended;

  return [
    {
      ignores: [...defaultAntiSlopAuditIgnores, ...ignores],
    },
    {
      files: ["**/*.{js,jsx,mjs,cjs}"],
      languageOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      plugins: recommended.plugins,
      rules: recommended.rules,
    },
    {
      files: ["**/*.{ts,tsx,mts,cts}"],
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
      plugins: recommended.plugins,
      rules: recommended.rules,
    },
  ];
}

export default antiSlopAiosAuditConfig();
