import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { relative, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const SECRET_RE =
  /\b(api[_-]?key|secret|token|password|private[_-]?key|client[_-]?secret)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/gi;
const PROTECTED_BRANCHES = new Set(["main", "master", "dev", "develop", "development"]);
const BRANCH_ENV_KEYS = ["AIOS_BRANCH", "GITHUB_REF_NAME", "GITHUB_HEAD_REF", "BRANCH_NAME", "VERCEL_GIT_COMMIT_REF"];
const DEV_ENV_KEYS = ["AIOS_DEV_ENVIRONMENT", "AIOS_DEV_ENV", "QUALITY_GATE_DEV_ENV", "GATE_CONNECTED_DEV_ENV"];

export function redactSecrets(text) {
  return String(text).replace(SECRET_RE, (_match, key) => `${key} = "[REDACTED]"`);
}

export function dedupeFingerprint(gate, ruleId, files, failurePattern) {
  const payload = [
    gate.trim().toLowerCase(),
    ruleId.trim().toLowerCase(),
    ...files.map((file) => file.trim().toLowerCase()).sort(),
    failurePattern.trim().toLowerCase(),
  ].join("\n");
  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

export function auditEventsFromEslintResults({
  repoRoot,
  results,
  runId = process.env.AIOS_RUN_ID ?? null,
  branch = currentBranch(repoRoot),
}) {
  const events = [];
  const gateDecision = qualityGateDecision(branch);

  for (const result of results) {
    const file = relative(repoRoot, result.filePath);
    for (const message of result.messages ?? []) {
      if (!message.ruleId?.startsWith("anti-slop/") || message.severity < 2) {
        continue;
      }

      const failurePattern = antiSlopPattern(message.ruleId);
      const fingerprint = dedupeFingerprint("Anti-Slop", message.ruleId, [file], failurePattern);
      events.push({
        schema_version: "1.0",
        event_id: randomUUID(),
        timestamp: new Date().toISOString(),
        repo: repoRoot.split("/").filter(Boolean).at(-1) ?? "unknown",
        branch,
        commit_sha: null,
        run_id: runId,
        actor_type: process.env.CI ? "ci" : "unknown",
        gate: "Anti-Slop",
        gate_version: null,
        event_type: "commit_blocked",
        severity: gateDecision === "block" ? "error" : "warning",
        category: "UX",
        rule_id: message.ruleId,
        rule_name: message.ruleId.replace("anti-slop/", ""),
        decision: gateDecision,
        summary: redactSecrets(
          `Anti-Slop ${gateDecision === "block" ? "blocked" : "warning only"} ${file}: ${message.message}`,
        ),
        evidence: [
          {
            file,
            line_start: message.line ?? 1,
            line_end: message.endLine ?? message.line ?? 1,
            reason: redactSecrets(message.message),
          },
        ],
        failure_pattern: failurePattern,
        root_cause_hypothesis: "UI implementation tripped a configured anti-slop rule.",
        required_fix: requiredFixForRule(message.ruleId),
        actual_fix: null,
        learning_lesson: `Address ${message.ruleId} before committing; anti-slop findings are product-quality defects, not lint noise.`,
        dedupe_fingerprint: fingerprint,
        related_event_ids: [],
        blocked_duration_seconds: null,
        tokens_wasted_estimate: null,
        notes: null,
      });
    }
  }

  return events;
}

export function qualityGateDecision(branch) {
  const mode = firstEnv(["AIOS_QUALITY_GATE_MODE", "QUALITY_GATE_MODE"])?.toLowerCase();
  if (["warn", "warning", "soft"].includes(mode)) {
    return "warn";
  }
  if (["block", "blocking", "hard"].includes(mode)) {
    return "block";
  }
  if (branch && PROTECTED_BRANCHES.has(normalizeBranch(branch))) {
    return "block";
  }
  if (DEV_ENV_KEYS.some((key) => truthy(process.env[key]))) {
    return "block";
  }
  if (["production", "development"].includes(process.env.VERCEL_ENV?.trim().toLowerCase() ?? "")) {
    return "block";
  }
  return branch ? "warn" : "block";
}

function currentBranch(repoRoot) {
  const envBranch = firstEnv(BRANCH_ENV_KEYS);
  if (envBranch) {
    return normalizeBranch(envBranch);
  }
  try {
    return normalizeBranch(execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim());
  } catch {
    return null;
  }
}

function firstEnv(keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}

function normalizeBranch(branch) {
  return branch.replace(/^refs\/heads\//, "").replace(/^origin\//, "");
}

function truthy(value) {
  return ["1", "true", "yes", "on", "block"].includes(value?.trim().toLowerCase() ?? "");
}

export function appendAuditEvents(repoRoot, events) {
  if (events.length === 0) {
    return;
  }

  const auditDir = join(repoRoot, ".aios", "audit");
  mkdirSync(auditDir, { recursive: true });
  const eventsPath = join(auditDir, "gate-events.jsonl");
  for (const event of events) {
    appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, "utf8");
  }
  const allEvents = readAuditEvents(eventsPath);
  writeFileSync(join(auditDir, "gate-summary.md"), renderSummary(allEvents), "utf8");
  writeFileSync(join(auditDir, "learning-lessons.md"), renderLessons(allEvents), "utf8");
}

function readAuditEvents(eventsPath) {
  try {
    return readFileSync(eventsPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((event) => event.schema_version === "1.0");
  } catch {
    return [];
  }
}

function renderSummary(events) {
  const latest = events.at(-1);
  const outcome = latest?.decision === "warn" ? "warnings only" : latest ? "blocked" : "unknown";
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
    latest?.decision === "warn" ? "- ready with warnings" : "- not ready to commit",
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
    const rows = grouped.get(event.dedupe_fingerprint) ?? [];
    rows.push(event);
    grouped.set(event.dedupe_fingerprint, rows);
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

function antiSlopPattern(ruleId) {
  const normalized = ruleId.replace("anti-slop/", "").replaceAll("-", " ");
  return `anti-slop ${normalized}`;
}

function requiredFixForRule(ruleId) {
  const fixes = {
    "anti-slop/no-placeholder-copy": "Replace placeholder copy with real product text.",
    "anti-slop/no-marketing-copy": "Replace generic marketing language with specific workflow copy.",
    "anti-slop/no-unjustified-use-client": "Remove the directive or add real client-only behavior.",
    "anti-slop/no-useless-memo": "Remove trivial memoization or justify a memo-sensitive boundary.",
    "anti-slop/require-empty-state-action": "Add an explicit empty-state action or action wording.",
    "anti-slop/no-demo-data-primary-path": "Use real data in primary routes or move demo data off the main path.",
    "anti-slop/no-defensive-guard-sprawl": "Move repeated shape checks into a centralized validator or type guard.",
    "anti-slop/no-generic-stat-label": "Use domain-specific metric labels.",
  };
  return fixes[ruleId] ?? "Fix the anti-slop rule violation before committing.";
}
