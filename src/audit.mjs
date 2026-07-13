import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { analysisErrorsFromResults } from "./analysis.mjs";
import {
  dedupeFingerprint,
  normalizeAntiSlopFindings,
  redactSecrets,
} from "./finding-core.mjs";
import { currentBranch, qualityGateDecision } from "./gate-policy.mjs";

const AUDIT_SCHEMA_VERSION = "1.1";
const SUPPORTED_AUDIT_SCHEMA_VERSIONS = new Set(["1.0", AUDIT_SCHEMA_VERSION]);

export { currentBranch, dedupeFingerprint, qualityGateDecision, redactSecrets };

export function auditEventsFromEslintResults({
  repoRoot,
  results,
  runId = process.env.AIOS_RUN_ID ?? null,
  branch = currentBranch(repoRoot),
}) {
  const analysisErrors = analysisErrorsFromResults({ repoRoot, results });
  if (analysisErrors.length > 0) {
    return [analysisFailureEvent({ repoRoot, runId, branch, errors: analysisErrors })];
  }

  const decision = qualityGateDecision(branch);
  return normalizeAntiSlopFindings({ repoRoot, results })
    .filter((finding) => finding.severity === "error")
    .map((finding) => ({
      schema_version: AUDIT_SCHEMA_VERSION,
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
      repo: repoName(repoRoot),
      branch,
      commit_sha: null,
      run_id: runId,
      actor_type: process.env.CI ? "ci" : "unknown",
      gate: "Anti-Slop",
      gate_version: null,
      event_type: decision === "block" ? "commit_blocked" : "finding_observed",
      severity: decision === "block" ? "error" : "warning",
      category: finding.category,
      rule_id: finding.ruleId,
      rule_name: finding.ruleName,
      decision,
      summary: redactSecrets(
        `Anti-Slop ${decision === "block" ? "blocked" : "warning only"} ${finding.file}: ${finding.message}`,
      ),
      evidence: [
        {
          file: finding.file,
          line_start: finding.line,
          line_end: finding.endLine,
          reason: finding.message,
        },
      ],
      failure_pattern: finding.failurePattern,
      root_cause_hypothesis: "UI implementation tripped a configured anti-slop rule.",
      required_fix: finding.requiredFix,
      actual_fix: null,
      learning_lesson: `Address ${finding.ruleId} before committing; anti-slop findings are product-quality defects, not lint noise.`,
      dedupe_fingerprint: finding.fingerprint,
      related_event_ids: [],
      blocked_duration_seconds: null,
      tokens_wasted_estimate: null,
      notes: null,
    }));
}

export function appendAuditEvents(repoRoot, events) {
  if (events.length === 0) {
    return;
  }

  const auditDir = join(repoRoot, ".aios", "audit");
  mkdirSync(auditDir, { recursive: true });
  const eventsPath = join(auditDir, "gate-events.jsonl");
  const analysisFailure = events.some((event) => event.event_type === "analysis_failed");
  if (analysisFailure) {
    writeFileSync(eventsPath, events.map((event) => `${JSON.stringify(event)}\n`).join(""), "utf8");
  } else {
    for (const event of events) {
      appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, "utf8");
    }
  }
  const allEvents = analysisFailure ? events : readAuditEvents(eventsPath);
  writeFileSync(join(auditDir, "gate-summary.md"), renderSummary(allEvents), "utf8");
  writeFileSync(join(auditDir, "learning-lessons.md"), renderLessons(allEvents), "utf8");
}

function analysisFailureEvent({ repoRoot, runId, branch, errors }) {
  const first = errors[0];
  const messages = errors.map((error) => error.message).join(" ");
  return {
    schema_version: AUDIT_SCHEMA_VERSION,
    event_id: randomUUID(),
    timestamp: new Date().toISOString(),
    repo: repoName(repoRoot),
    branch,
    commit_sha: null,
    run_id: runId,
    actor_type: process.env.CI ? "ci" : "unknown",
    gate: "Anti-Slop",
    gate_version: null,
    event_type: "analysis_failed",
    severity: "error",
    category: null,
    rule_id: null,
    rule_name: null,
    decision: "error",
    summary: `Anti-Slop analysis failed: ${messages}`,
    evidence: errors.map((error) => ({
      file: error.file,
      line_start: error.line,
      line_end: error.line,
      reason: error.message,
    })),
    failure_pattern: null,
    root_cause_hypothesis: null,
    required_fix: null,
    actual_fix: null,
    learning_lesson: `Resolve fatal ESLint analysis errors before trusting audit output: ${first.message}`,
    dedupe_fingerprint: dedupeFingerprint(
      "Anti-Slop",
      "analysis-failure",
      errors.map((error) => error.file ?? "<unknown>"),
      messages,
    ),
    related_event_ids: [],
    blocked_duration_seconds: null,
    tokens_wasted_estimate: null,
    notes: null,
  };
}

function repoName(repoRoot) {
  return repoRoot.split("/").filter(Boolean).at(-1) ?? "unknown";
}

function readAuditEvents(eventsPath) {
  try {
    return readFileSync(eventsPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((event) => SUPPORTED_AUDIT_SCHEMA_VERSIONS.has(event.schema_version));
  } catch {
    return [];
  }
}

function renderSummary(events) {
  const latest = events.at(-1);
  const outcome = latest?.decision === "warn"
    ? "warnings only"
    : latest?.decision === "error"
      ? "analysis failed"
      : latest
        ? "blocked"
        : "unknown";
  const decisions = events
    .slice(-10)
    .map((event) => `- ${event.gate} ${event.decision} [${event.severity}]: ${event.summary}`)
    .join("\n");
  const lessons = [...new Set(events.map((event) => event.learning_lesson).filter(Boolean))]
    .slice(-8)
    .map((lesson) => `- ${lesson}`)
    .join("\n");

  return [
    "# Gate Audit Summary",
    "",
    "## Current run outcome",
    "",
    `- Outcome: ${outcome}`,
    "",
    "## Gate decisions",
    "",
    decisions || "- No gate decisions recorded.",
    "",
    "## Repeated failure patterns",
    "",
    ...repeatedPatternLines(events),
    "",
    "## Agent learning lessons",
    "",
    lessons || "- No gate-backed lessons recorded yet.",
    "",
    "## Commit-readiness status",
    "",
    latest?.decision === "warn"
      ? "- ready with warnings"
      : latest?.decision === "error"
        ? "- analysis failed; not ready to commit"
        : "- not ready to commit",
    "",
  ].join("\n");
}

function renderLessons(events) {
  return [
    "# Gate Learning Lessons",
    "",
    "## Active repeated failure patterns",
    "",
    ...repeatedPatternLines(events),
    "",
    "## Current repo-specific rules learned from gate history",
    "",
    ...[...new Set(events.map((event) => event.learning_lesson).filter(Boolean))].map(
      (lesson) => `- ${lesson}`,
    ),
    "",
    "## High-priority agent reminders",
    "",
    ...[...new Set(events.filter((event) => event.severity === "error").map((event) => event.learning_lesson))]
      .filter(Boolean)
      .map((lesson) => `- ${lesson}`),
    "",
  ].join("\n");
}

function repeatedPatternLines(events) {
  const grouped = new Map();
  for (const event of events) {
    if (!event.failure_pattern) {
      continue;
    }
    const fingerprintKey = `${event.schema_version}:${event.dedupe_fingerprint}`;
    const rows = grouped.get(fingerprintKey) ?? [];
    rows.push(event);
    grouped.set(fingerprintKey, rows);
  }

  const lines = [];
  for (const rows of grouped.values()) {
    if (rows.length < 2) {
      continue;
    }
    const first = rows[0];
    lines.push(`### Pattern: ${first.failure_pattern}`);
    lines.push(`- Seen: ${rows.length} times`);
    lines.push(`- Gates: ${[...new Set(rows.map((event) => event.gate))].join(", ")}`);
    lines.push(`- Category: ${first.category}`);
    lines.push(`- Common cause: ${first.root_cause_hypothesis}`);
    lines.push(`- Avoid by: ${first.learning_lesson}`);
    lines.push(`- Example fix: ${first.required_fix}`);
  }

  return lines.length > 0 ? lines : ["No repeated failure patterns have been recorded yet."];
}
