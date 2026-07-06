import type { ESLint } from "eslint";

export interface AntiSlopAuditEvent {
  schema_version: string;
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
  category: string;
  rule_id: string;
  rule_name: string;
  decision: "block" | "warn";
  summary: string;
  evidence: Array<{
    file: string;
    line_start: number;
    line_end: number;
    reason: string;
  }>;
  failure_pattern: string;
  root_cause_hypothesis: string;
  required_fix: string;
  actual_fix: string | null;
  learning_lesson: string;
  dedupe_fingerprint: string;
  related_event_ids: string[];
  blocked_duration_seconds: number | null;
  tokens_wasted_estimate: number | null;
  notes: string | null;
}

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
