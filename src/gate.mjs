import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeAntiSlopFindings } from "./finding-core.mjs";
import { qualityGateDecision } from "./gate-policy.mjs";
import { AntiSlopInputError, VALID_MODES } from "./input.mjs";
import { ruleMetadata } from "./rule-metadata.mjs";

const GATE_SCHEMA_VERSION = "1.1";
const DEFAULT_CONFIG = {
  files: ["."],
  ignores: [],
  mode: "auto",
  baselinePath: ".anti-slop-baseline.json",
  outputPath: null,
};
const CONFIG_KEYS = new Set(Object.keys(DEFAULT_CONFIG));

export function readAntiSlopConfig(repoRoot) {
  const configPath = join(repoRoot, "anti-slop.config.json");
  if (!existsSync(configPath)) {
    return defaultConfig();
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    throw new AntiSlopInputError("configuration", configPath, "must contain valid JSON.");
  }

  return validateConfig(parsed, configPath);
}

export function antiSlopFindingsFromResults(input) {
  return normalizeAntiSlopFindings(input);
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
  analysis,
}) {
  const normalizedAnalysis = normalizeAnalysis(analysis);
  const { newFindings, baselinedFindings } = filterBaselineFindings(findings, baseline);
  const effectiveMode = effectiveModeFor(mode, branch);
  const hasErrors = newFindings.some((finding) => finding.severity === "error");
  const hasWarnings = newFindings.some((finding) => finding.severity === "warning");
  const base = {
    schemaVersion: GATE_SCHEMA_VERSION,
    gate: "Anti-Slop",
    repoRoot,
    branch,
    mode,
    effectiveMode,
    analysis: normalizedAnalysis,
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

  if (normalizedAnalysis.status === "failed") {
    return { ...base, decision: "error", exitCode: 1 };
  }

  if (normalizedAnalysis.status === "skipped") {
    return { ...base, decision: "skipped", exitCode: 0 };
  }

  const shouldBlock = effectiveMode === "block" && hasErrors;
  const decision = shouldBlock ? "block" : hasErrors || hasWarnings ? "warn" : "pass";
  return { ...base, decision, exitCode: shouldBlock ? 1 : 0 };
}

export function formatGateReport(report, format = "text") {
  if (format === "json") {
    return `${JSON.stringify(report, null, 2)}\n`;
  }

  if (format === "jsonl" || format === "pre-cr") {
    if (report.analysis.status !== "complete") {
      return `${JSON.stringify(analysisRecord(report))}\n`;
    }
    return report.newFindings.map((finding) => JSON.stringify(formatFinding(report, finding))).join("\n") + "\n";
  }

  if (format === "sarif") {
    return `${JSON.stringify(sarifFromGateReport(report), null, 2)}\n`;
  }

  return textFromGateReport(report);
}

export function sarifFromGateReport(report) {
  const rules = Object.entries(ruleMetadata).map(([ruleId, metadata]) => ({
    id: ruleId,
    name: ruleId.replace("anti-slop/", ""),
    shortDescription: { text: metadata.requiredFix },
    properties: {
      category: metadata.category,
      recommendedSeverity: metadata.recommendedSeverity,
    },
  }));
  const results = report.newFindings.map((finding) => ({
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
  }));

  if (report.analysis.status === "failed") {
    rules.push({
      id: "anti-slop/analysis-failure",
      name: "analysis-failure",
      shortDescription: { text: "Resolve fatal ESLint analysis errors before trusting gate findings." },
      properties: { category: "Analysis", recommendedSeverity: "error" },
    });
    results.push({
      ruleId: "anti-slop/analysis-failure",
      level: "error",
      message: { text: report.analysis.errors.map((error) => error.message).join(" ") },
      properties: { analysis: report.analysis },
    });
  }

  if (report.analysis.status === "skipped") {
    rules.push({
      id: "anti-slop/analysis-skipped",
      name: "analysis-skipped",
      shortDescription: { text: "No files were selected for Anti-Slop analysis." },
      properties: { category: "Analysis", recommendedSeverity: "note" },
    });
    results.push({
      ruleId: "anti-slop/analysis-skipped",
      level: "note",
      message: { text: "Anti-Slop analysis skipped: no files selected." },
      properties: { analysis: report.analysis },
    });
  }

  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "eslint-plugin-anti-slop",
            informationUri: "https://github.com/jakyeamos/eslint-plugin-anti-slop",
            rules,
          },
        },
        invocations: [{ executionSuccessful: report.analysis.status !== "failed" }],
        results,
      },
    ],
  };
}

function defaultConfig() {
  return {
    ...DEFAULT_CONFIG,
    files: [...DEFAULT_CONFIG.files],
    ignores: [...DEFAULT_CONFIG.ignores],
  };
}

function validateConfig(parsed, configPath) {
  if (!isPlainObject(parsed)) {
    throw new AntiSlopInputError("configuration", configPath, "must contain an object.");
  }

  for (const key of Object.keys(parsed)) {
    if (!CONFIG_KEYS.has(key)) {
      throw new AntiSlopInputError("configuration", configPath, `Unknown configuration field \"${key}\".`);
    }
  }

  const config = defaultConfig();
  if ("files" in parsed) {
    config.files = stringArray(parsed.files, "files", configPath);
    if (config.files.length === 0) {
      throw new AntiSlopInputError("configuration", configPath, "\"files\" must contain at least one path.");
    }
  }
  if ("ignores" in parsed) {
    config.ignores = stringArray(parsed.ignores, "ignores", configPath);
  }
  if ("mode" in parsed) {
    if (typeof parsed.mode !== "string" || !VALID_MODES.has(parsed.mode)) {
      throw new AntiSlopInputError("configuration", configPath, "\"mode\" must be one of auto, block, warn, audit.");
    }
    config.mode = parsed.mode;
  }
  if ("baselinePath" in parsed) {
    config.baselinePath = nonEmptyString(parsed.baselinePath, "baselinePath", configPath);
  }
  if ("outputPath" in parsed) {
    if (parsed.outputPath !== null) {
      config.outputPath = nonEmptyString(parsed.outputPath, "outputPath", configPath);
    }
  }

  return config;
}

function stringArray(value, field, configPath) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new AntiSlopInputError("configuration", configPath, `\"${field}\" must be an array of non-empty strings.`);
  }
  return [...value];
}

function nonEmptyString(value, field, configPath) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AntiSlopInputError("configuration", configPath, `\"${field}\" must be a non-empty string.`);
  }
  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeAnalysis(analysis) {
  return {
    status: analysis?.status ?? "complete",
    selection: analysis?.selection ?? "configured",
    files: [...(analysis?.files ?? [])],
    errors: [...(analysis?.errors ?? [])],
  };
}

function effectiveModeFor(mode, branch) {
  if (mode === "auto") {
    return qualityGateDecision(branch);
  }
  return mode === "block" ? "block" : "warn";
}

function analysisRecord(report) {
  return {
    schema_version: GATE_SCHEMA_VERSION,
    record_type: `analysis_${report.analysis.status}`,
    gate: report.gate,
    decision: report.decision,
    mode: report.effectiveMode,
    analysis: report.analysis,
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
  if (report.analysis.status === "failed") {
    const lines = [`Anti-Slop analysis failed: ${report.analysis.errors.length} error(s).`];
    for (const error of report.analysis.errors) {
      const location = error.file ? `${error.file}${error.line ? `:${error.line}` : ""}` : "ESLint";
      lines.push(`ERROR ${location} ${error.message}`);
    }
    return `${lines.join("\n")}\n`;
  }

  if (report.analysis.status === "skipped") {
    return "Anti-Slop analysis skipped: no files selected.\n";
  }

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
