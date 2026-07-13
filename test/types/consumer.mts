import type { ESLint, Linter } from "eslint";
import antiSlopPlugin from "eslint-plugin-anti-slop";
import {
  appendAuditEvents,
  auditEventsFromEslintResults,
  currentBranch,
  dedupeFingerprint,
  qualityGateDecision,
  redactSecrets,
  type AntiSlopAuditEvent,
} from "eslint-plugin-anti-slop/audit";
import defaultAntiSlopAiosAuditConfig, {
  aiosAuditArtifacts,
  antiSlopAiosAuditConfig,
  antiSlopAuditFormatter,
  defaultAntiSlopAuditIgnores,
} from "eslint-plugin-anti-slop/aios-audit-config";
import formatAuditResults from "eslint-plugin-anti-slop/audit-formatter";
import formatAuditResultsByExtension from "eslint-plugin-anti-slop/audit-formatter.mjs";
import { runCli, type AntiSlopCliDependencies } from "eslint-plugin-anti-slop/cli";
import {
  antiSlopFindingsFromResults,
  buildGateReport,
  filterBaselineFindings,
  formatGateReport,
  readAntiSlopConfig,
  sarifFromGateReport,
  type AntiSlopFinding,
  type AntiSlopAnalysisStatus,
  type AntiSlopGateFormat,
  type AntiSlopGateMode,
  type AntiSlopGateReport,
  type AntiSlopProjectConfig,
} from "eslint-plugin-anti-slop/gate";
import {
  metadataForRule,
  ruleMetadata,
  type AntiSlopRuleMetadata,
} from "eslint-plugin-anti-slop/rule-metadata";

const eslintResults: ESLint.LintResult[] = [];

const finding: AntiSlopFinding = {
  ruleId: "anti-slop/no-placeholder-copy",
  ruleName: "no-placeholder-copy",
  severity: "error",
  eslintSeverity: 2,
  category: "UX",
  file: "fixture.ts",
  line: 1,
  column: 1,
  endLine: 1,
  message: "Placeholder copy detected.",
  requiredFix: "Replace placeholder copy with real product text.",
  failurePattern: "anti-slop no-placeholder-copy",
  fingerprint: "fixture-fingerprint",
};

const auditEvent: AntiSlopAuditEvent = {
  schema_version: "1.0",
  event_id: "fixture-event",
  timestamp: "2026-01-01T00:00:00.000Z",
  repo: "fixture",
  branch: "main",
  commit_sha: null,
  run_id: null,
  actor_type: "ci",
  gate: "Anti-Slop",
  gate_version: null,
  event_type: "commit_blocked",
  severity: "error",
  category: "UX",
  rule_id: finding.ruleId,
  rule_name: finding.ruleName,
  decision: "block",
  summary: finding.message,
  evidence: [{ file: finding.file, line_start: finding.line, line_end: finding.endLine, reason: finding.message }],
  failure_pattern: finding.failurePattern,
  root_cause_hypothesis: "Fixture only.",
  required_fix: finding.requiredFix,
  actual_fix: null,
  learning_lesson: "Fixture only.",
  dedupe_fingerprint: finding.fingerprint,
  related_event_ids: [],
  blocked_duration_seconds: null,
  tokens_wasted_estimate: null,
  notes: null,
};

const cliDependencies: AntiSlopCliDependencies = {
  cwd: "/workspace/fixture",
  stdout: (_text: string): void => {},
  stderr: (_text: string): void => {},
  changedFiles: (_cwd: string): string[] => [],
  eslintRunner: async (_files, _options): Promise<ESLint.LintResult[]> => eslintResults,
};

export function assertPublicTypeContract(): void {
  const namespace: "anti-slop" = antiSlopPlugin.meta.namespace;
  const pluginConfig: Linter.Config = antiSlopPlugin.configs.recommended;
  const pluginRuleIds: string[] = Object.keys(antiSlopPlugin.rules);

  const formattedSecret: string = redactSecrets("token = 'fixture-token'");
  const fingerprint: string = dedupeFingerprint("Anti-Slop", finding.ruleId, [finding.file], finding.failurePattern);
  const auditDecision: "block" | "warn" = qualityGateDecision("main");
  const branch: string | null = currentBranch("/workspace/fixture");
  const events: AntiSlopAuditEvent[] = auditEventsFromEslintResults({
    repoRoot: "/workspace/fixture",
    results: eslintResults,
    runId: null,
    branch,
  });
  const append: (repoRoot: string, events: AntiSlopAuditEvent[]) => void = appendAuditEvents;

  const auditConfig: Linter.Config[] = antiSlopAiosAuditConfig({ ignores: ["coverage/**"] });
  const defaultConfig: Linter.Config[] = defaultAntiSlopAiosAuditConfig;
  const formatterPath: string = antiSlopAuditFormatter;
  const artifactPaths: readonly string[] = aiosAuditArtifacts;
  const defaultIgnores: readonly string[] = defaultAntiSlopAuditIgnores;
  const formatterOutput: string = formatAuditResults(eslintResults, { cwd: "/workspace/fixture" });
  const formatterOutputByExtension: string = formatAuditResultsByExtension(eslintResults);

  const run: (argv: string[], dependencies?: AntiSlopCliDependencies) => Promise<number> = runCli;
  const cliExitCode: Promise<number> = runCli(["check"], cliDependencies);

  const mode: AntiSlopGateMode = "block";
  const format: AntiSlopGateFormat = "json";
  const projectConfig: AntiSlopProjectConfig = readAntiSlopConfig("/workspace/fixture");
  const detectedFindings: AntiSlopFinding[] = antiSlopFindingsFromResults({
    repoRoot: "/workspace/fixture",
    results: eslintResults,
  });
  const baseline = filterBaselineFindings([finding], [finding.fingerprint]);
  const report: AntiSlopGateReport = buildGateReport({
    findings: [finding],
    mode,
    branch: "main",
    baseline: baseline.baselinedFindings.map((item) => item.fingerprint),
    repoRoot: "/workspace/fixture",
  });
  const formattedReport: string = formatGateReport(report, format);
  const sarif: Record<string, unknown> = sarifFromGateReport(report);
  const analysisStatus: AntiSlopAnalysisStatus = report.analysis.status;

  const metadata: AntiSlopRuleMetadata = metadataForRule(finding.ruleId);
  const metadataByRule: Record<string, AntiSlopRuleMetadata> = ruleMetadata;

  void namespace;
  void pluginConfig;
  void pluginRuleIds;
  void formattedSecret;
  void fingerprint;
  void auditDecision;
  void events;
  void append;
  void auditConfig;
  void defaultConfig;
  void formatterPath;
  void artifactPaths;
  void defaultIgnores;
  void formatterOutput;
  void formatterOutputByExtension;
  void run;
  void cliExitCode;
  void projectConfig;
  void detectedFindings;
  void formattedReport;
  void sarif;
  void analysisStatus;
  void metadata;
  void metadataByRule;
  void auditEvent;
}
