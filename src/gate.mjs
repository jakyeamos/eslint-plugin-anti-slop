import { existsSync, readFileSync } from "node:fs";
import { relative, join } from "node:path";
import { dedupeFingerprint, qualityGateDecision, redactSecrets } from "./audit.mjs";
import { metadataForRule, ruleMetadata } from "./rule-metadata.mjs";

const DEFAULT_CONFIG = {
  files: ["."],
  ignores: [],
  mode: "auto",
  baselinePath: ".anti-slop-baseline.json",
  outputPath: null,
};

export function readAntiSlopConfig(repoRoot) {
  const configPath = join(repoRoot, "anti-slop.config.json");
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const parsed = JSON.parse(readFileSync(configPath, "utf8"));
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
  };
}

export function antiSlopFindingsFromResults({ repoRoot, results }) {
  const findings = [];

  for (const result of results) {
    const file = relative(repoRoot, result.filePath);
    for (const message of result.messages ?? []) {
      if (!message.ruleId?.startsWith("anti-slop/")) {
        continue;
      }

      const metadata = metadataForRule(message.ruleId);
      const failurePattern = antiSlopPattern(message.ruleId);
      findings.push({
        ruleId: message.ruleId,
        ruleName: message.ruleId.replace("anti-slop/", ""),
        severity: message.severity >= 2 ? "error" : "warning",
        eslintSeverity: message.severity,
        category: metadata.category,
        file,
        line: message.line ?? 1,
        column: message.column ?? 1,
        endLine: message.endLine ?? message.line ?? 1,
        message: redactSecrets(message.message),
        requiredFix: metadata.requiredFix,
        failurePattern,
        fingerprint: dedupeFingerprint("Anti-Slop", message.ruleId, [file], failurePattern),
      });
    }
  }

  return findings;
}

export function filterBaselineFindings(findings, baseline = []) {
  const baselineSet = new Set(baseline);
  const newFindings = [];
  const baselinedFindings = [];

  for (const finding of findings) {
    if (baselineSet.has(finding.fingerprint)) {
      baselinedFindings.push(finding);
    } else {
      newFindings.push(finding);
    }
  }

  return { newFindings, baselinedFindings };
}

export function buildGateReport({
  findings,
  mode = "auto",
  branch = null,
  baseline = [],
  repoRoot = process.cwd(),
}) {
  const { newFindings, baselinedFindings } = filterBaselineFindings(findings, baseline);
  const hasErrors = newFindings.some((finding) => finding.severity === "error");
  const hasWarnings = newFindings.some((finding) => finding.severity === "warning");
  const effectiveMode = mode === "auto" ? qualityGateDecision(branch) : mode;
  const shouldBlock = effectiveMode === "block" && hasErrors;
  const decision = shouldBlock ? "block" : hasErrors || hasWarnings ? "warn" : "pass";

  return {
    schemaVersion: "1.0",
    gate: "Anti-Slop",
    repoRoot,
    branch,
    mode,
    effectiveMode,
    decision,
    exitCode: shouldBlock ? 1 : 0,
    findings,
    newFindings,
    baselinedFindings,
    summary: {
      total: findings.length,
      new: newFindings.length,
      baselined: baselinedFindings.length,
      errors: newFindings.filter((finding) => finding.severity === "error").length,
      warnings: newFindings.filter((finding) => finding.severity === "warning").length,
    },
  };
}

export function formatGateReport(report, format = "text") {
  if (format === "json") {
    return `${JSON.stringify(report, null, 2)}\n`;
  }

  if (format === "jsonl" || format === "pre-cr") {
    return report.newFindings.map((finding) => JSON.stringify(formatFinding(report, finding))).join("\n") + "\n";
  }

  if (format === "sarif") {
    return `${JSON.stringify(sarifFromGateReport(report), null, 2)}\n`;
  }

  return textFromGateReport(report);
}

export function sarifFromGateReport(report) {
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "eslint-plugin-anti-slop",
            informationUri: "https://github.com/jakyeamos/eslint-plugin-anti-slop",
            rules: Object.entries(ruleMetadata).map(([ruleId, metadata]) => ({
              id: ruleId,
              name: ruleId.replace("anti-slop/", ""),
              shortDescription: { text: metadata.requiredFix },
              properties: {
                category: metadata.category,
                recommendedSeverity: metadata.recommendedSeverity,
              },
            })),
          },
        },
        results: report.newFindings.map((finding) => ({
          ruleId: finding.ruleId,
          level: finding.severity === "error" ? "error" : "warning",
          message: { text: finding.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.file },
                region: {
                  startLine: finding.line,
                  startColumn: finding.column,
                  endLine: finding.endLine,
                },
              },
            },
          ],
          fingerprints: {
            "anti-slop": finding.fingerprint,
          },
          properties: {
            requiredFix: finding.requiredFix,
          },
        })),
      },
    ],
  };
}

function formatFinding(report, finding) {
  return {
    schema_version: "1.0",
    gate: report.gate,
    decision: report.decision,
    mode: report.effectiveMode,
    rule_id: finding.ruleId,
    severity: finding.severity,
    category: finding.category,
    file: finding.file,
    line: finding.line,
    column: finding.column,
    message: finding.message,
    required_fix: finding.requiredFix,
    fingerprint: finding.fingerprint,
  };
}

function textFromGateReport(report) {
  const headline = report.decision === "block"
    ? "Anti-Slop gate blocked"
    : report.decision === "warn"
      ? "Anti-Slop gate warnings"
      : "Anti-Slop gate passed";
  const lines = [
    `${headline}: ${report.summary.new} new finding(s), ${report.summary.baselined} baselined.`,
  ];

  for (const finding of report.newFindings) {
    lines.push(`${finding.severity.toUpperCase()} ${finding.file}:${finding.line}:${finding.column} ${finding.ruleId} ${finding.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function antiSlopPattern(ruleId) {
  const normalized = ruleId.replace("anti-slop/", "").replaceAll("-", " ");
  return `anti-slop ${normalized}`;
}
