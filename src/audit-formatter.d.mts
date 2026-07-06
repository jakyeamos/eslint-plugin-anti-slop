import type { ESLint } from "eslint";

declare function formatAuditResults(results: ESLint.LintResult[], context?: { cwd?: string }): string;

export default formatAuditResults;
