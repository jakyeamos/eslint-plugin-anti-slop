import type { ESLint } from "eslint";

export interface AntiSlopAuditEventBase {
  schema_version: "1.0" | "1.1";
  event_id: string;
  timestamp: string;
  repo: string;
  branch: string | null;
  commit_sha: string | null;
  run_id: string | null;
  actor_type: string;
  gate: "Anti-Slop";
  gate_version: string | null;
  event_type: string;
  severity: "error" | "warning";
  category: string | null;
  rule_id: string | null;
  rule_name: string | null;
  decision: "block" | "warn" | "error";
  summary: string;
  evidence: Array<{
    file: string | null;
    line_start: number | null;
    line_end: number | null;
    reason: string;
  }>;
  failure_pattern: string | null;
  root_cause_hypothesis: string | null;
  required_fix: string | null;
  actual_fix: string | null;
  learning_lesson: string | null;
  dedupe_fingerprint: string;
  related_event_ids: string[];
  blocked_duration_seconds: number | null;
  tokens_wasted_estimate: number | null;
  notes: string | null;
}

export interface AntiSlopAuditFindingFields {
  category: string;
  rule_id: string;
  rule_name: string;
  evidence: Array<{
    file: string;
    line_start: number;
    line_end: number;
    reason: string;
  }>;
  failure_pattern: string;
  root_cause_hypothesis: string;
  required_fix: string;
  learning_lesson: string;
}

type AntiSlopAuditFindingEventBase = Omit<
  AntiSlopAuditEventBase,
  | "schema_version"
  | "event_type"
  | "category"
  | "rule_id"
  | "rule_name"
  | "decision"
  | "evidence"
  | "failure_pattern"
  | "root_cause_hypothesis"
  | "required_fix"
  | "learning_lesson"
>;

export type AntiSlopAuditFindingEventV1 = AntiSlopAuditFindingEventBase & AntiSlopAuditFindingFields & {
  schema_version: "1.0";
  event_type: string;
  decision: "block" | "warn";
};

export type AntiSlopAuditFindingEventV1_1 = AntiSlopAuditFindingEventBase & AntiSlopAuditFindingFields & {
  schema_version: "1.1";
  event_type: "commit_blocked" | "finding_observed";
  decision: "block" | "warn";
};

export interface AntiSlopAuditAnalysisFailureEventV1_1 extends AntiSlopAuditEventBase {
  schema_version: "1.1";
  event_type: "analysis_failed";
  severity: "error";
  category: null;
  rule_id: null;
  rule_name: null;
  decision: "error";
  evidence: Array<{
    file: string | null;
    line_start: number | null;
    line_end: number | null;
    reason: string;
  }>;
  failure_pattern: null;
  root_cause_hypothesis: null;
  required_fix: null;
  learning_lesson: string;
}

export type AntiSlopAuditEvent =
  | AntiSlopAuditFindingEventV1
  | AntiSlopAuditFindingEventV1_1
  | AntiSlopAuditAnalysisFailureEventV1_1;

export declare function redactSecrets(text: string): string;

export declare function dedupeFingerprint(
  gate: string,
  ruleId: string,
  files: string[],
  failurePattern: string,
): string;

export declare function auditEventsFromEslintResults(input: {
  repoRoot: string;
  results: ESLint.LintResult[];
  runId?: string | null;
  branch?: string | null;
}): AntiSlopAuditEvent[];

export declare function qualityGateDecision(branch: string | null): "block" | "warn";

export declare function currentBranch(repoRoot: string): string | null;

export declare function appendAuditEvents(repoRoot: string, events: AntiSlopAuditEvent[]): void;
