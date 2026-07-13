import type { ESLint } from "eslint";

export type AntiSlopGateMode = "auto" | "block" | "warn" | "audit";
export type AntiSlopGateFormat = "text" | "json" | "jsonl" | "pre-cr" | "sarif";
export type AntiSlopGateDecision = "block" | "warn" | "pass" | "skipped" | "error";
export type AntiSlopAnalysisStatus = "complete" | "skipped" | "failed";
export type AntiSlopAnalysisSelection = "explicit" | "configured" | "changed";

export interface AntiSlopAnalysisError {
  kind: "eslint" | "parser";
  file: string | null;
  line: number | null;
  column: number | null;
  message: string;
}

export interface AntiSlopAnalysis {
  status: AntiSlopAnalysisStatus;
  selection: AntiSlopAnalysisSelection;
  files: string[];
  errors: AntiSlopAnalysisError[];
}

export interface AntiSlopProjectConfig {
  files: string[];
  ignores: string[];
  mode: AntiSlopGateMode;
  baselinePath: string;
  outputPath: string | null;
}

export interface AntiSlopFinding {
  ruleId: string;
  ruleName: string;
  severity: "error" | "warning";
  eslintSeverity: number;
  category: string;
  file: string;
  line: number;
  column: number;
  endLine: number;
  message: string;
  requiredFix: string;
  failurePattern: string;
  fingerprint: string;
}

export interface AntiSlopGateReport {
  schemaVersion: string;
  gate: "Anti-Slop";
  repoRoot: string;
  branch: string | null;
  mode: AntiSlopGateMode;
  effectiveMode: "block" | "warn";
  decision: AntiSlopGateDecision;
  exitCode: number;
  analysis: AntiSlopAnalysis;
  findings: AntiSlopFinding[];
  newFindings: AntiSlopFinding[];
  baselinedFindings: AntiSlopFinding[];
  summary: {
    total: number;
    new: number;
    baselined: number;
    errors: number;
    warnings: number;
  };
}

export declare function readAntiSlopConfig(repoRoot: string): AntiSlopProjectConfig;

export declare function antiSlopFindingsFromResults(input: {
  repoRoot: string;
  results: ESLint.LintResult[];
}): AntiSlopFinding[];

export declare function filterBaselineFindings(
  findings: AntiSlopFinding[],
  baseline?: string[],
): {
  newFindings: AntiSlopFinding[];
  baselinedFindings: AntiSlopFinding[];
};

export declare function buildGateReport(input: {
  findings: AntiSlopFinding[];
  mode?: AntiSlopGateMode;
  branch?: string | null;
  baseline?: string[];
  repoRoot?: string;
  analysis?: AntiSlopAnalysis;
}): AntiSlopGateReport;

export declare function formatGateReport(report: AntiSlopGateReport, format?: AntiSlopGateFormat): string;

export declare function sarifFromGateReport(report: AntiSlopGateReport): Record<string, unknown>;
