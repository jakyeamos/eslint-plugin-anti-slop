import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import picomatch from "picomatch";
import { analysisErrorFromException, analysisErrorsFromResults } from "./analysis.mjs";
import { antiSlopAiosAuditConfig } from "./aios-audit-config.mjs";
import { currentBranch } from "./gate-policy.mjs";
import {
  antiSlopFindingsFromResults,
  buildGateReport,
  formatGateReport,
  readAntiSlopConfig,
} from "./gate.mjs";
import { AntiSlopInputError, isAntiSlopInputError, VALID_MODES } from "./input.mjs";

const VALID_COMMANDS = new Set(["check", "gate"]);
const VALID_FORMATS = new Set(["text", "json", "jsonl", "pre-cr", "sarif"]);

export async function runCli(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? ((text) => process.stdout.write(text));
  const stderr = dependencies.stderr ?? ((text) => process.stderr.write(text));
  const cwd = dependencies.cwd ?? process.cwd();
  const parsed = parseArgs(argv);

  if (!parsed.ok) {
    stderr(`${usage()}\n${parsed.error}\n`);
    return 2;
  }

  if (parsed.help) {
    stdout(`${usage()}\n`);
    return 0;
  }

  let projectConfig;
  let baseline;
  let selection;
  try {
    projectConfig = readAntiSlopConfig(cwd);
    baseline = readBaseline(resolve(cwd, parsed.options.baseline ?? projectConfig.baselinePath));
    selection = filesForRun({
      parsed,
      projectConfig,
      cwd,
      changedFiles: dependencies.changedFiles ?? defaultChangedFiles,
    });
  } catch (error) {
    stderr(`${inputErrorMessage(error, cwd)}\n`);
    return 2;
  }

  const mode = parsed.options.mode ?? projectConfig.mode;
  const format = parsed.options.format ?? (parsed.command === "gate" ? "pre-cr" : "text");
  const baselinePath = parsed.options.baseline ?? projectConfig.baselinePath;
  const branch = parsed.options.branch ?? currentBranch(cwd);

  if (selection.files.length === 0) {
    const report = buildGateReport({
      findings: [],
      mode,
      branch,
      baseline,
      repoRoot: cwd,
      analysis: { status: "skipped", selection: selection.kind, files: [], errors: [] },
    });
    emitReport({ report, format, outputPath: projectConfig.outputPath, cwd, stdout });
    return report.exitCode;
  }

  const eslintRunner = dependencies.eslintRunner ?? defaultEslintRunner(cwd, projectConfig);
  let results;
  try {
    results = await eslintRunner(selection.files, { cwd, ignores: projectConfig.ignores });
  } catch (error) {
    const errors = [analysisErrorFromException(error)];
    const report = buildGateReport({
      findings: [],
      mode,
      branch,
      baseline,
      repoRoot: cwd,
      analysis: { status: "failed", selection: selection.kind, files: selection.files, errors },
    });
    stderr(`${analysisFailureMessage(errors)}\n`);
    emitReport({ report, format, outputPath: projectConfig.outputPath, cwd, stdout });
    return report.exitCode;
  }

  const errors = analysisErrorsFromResults({ repoRoot: cwd, results });
  const findings = antiSlopFindingsFromResults({ repoRoot: cwd, results });
  const report = buildGateReport({
    findings,
    mode,
    branch,
    baseline,
    repoRoot: cwd,
    analysis: {
      status: errors.length > 0 ? "failed" : "complete",
      selection: selection.kind,
      files: selection.files,
      errors,
    },
  });

  if (report.analysis.status === "failed") {
    stderr(`${analysisFailureMessage(errors)}\n`);
    emitReport({ report, format, outputPath: projectConfig.outputPath, cwd, stdout });
    return report.exitCode;
  }

  if (parsed.options.updateBaseline) {
    writeBaseline(resolve(cwd, baselinePath), findings);
    stdout(`Updated Anti-Slop baseline with ${findings.length} finding(s) at ${baselinePath}\n`);
    return 0;
  }

  emitReport({ report, format, outputPath: projectConfig.outputPath, cwd, stdout });
  return report.exitCode;
}

function parseArgs(argv) {
  const [command = "check", ...rest] = argv;
  if (command === "--help" || command === "-h") {
    return { ok: true, help: true, command: "check", options: {}, files: [] };
  }
  if (!VALID_COMMANDS.has(command)) {
    return { ok: false, error: `Unknown command: ${command}` };
  }
  if (rest.includes("--help") || rest.includes("-h")) {
    return { ok: true, help: true, command, options: {}, files: [] };
  }

  const options = {};
  const files = [];

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--changed") {
      options.changed = true;
      continue;
    }

    if (arg === "--update-baseline") {
      options.updateBaseline = true;
      continue;
    }

    if (["--format", "--mode", "--baseline", "--branch", "--files"].includes(arg)) {
      const value = rest[index + 1];
      if (!value) {
        return { ok: false, error: `Missing value for ${arg}` };
      }
      index += 1;

      if (arg === "--format") {
        if (!VALID_FORMATS.has(value)) {
          return { ok: false, error: `Invalid format: ${value}` };
        }
        options.format = value;
      } else if (arg === "--mode") {
        if (!VALID_MODES.has(value)) {
          return { ok: false, error: `Invalid mode: ${value}` };
        }
        options.mode = value;
      } else if (arg === "--baseline") {
        options.baseline = value;
      } else if (arg === "--branch") {
        options.branch = value;
      } else {
        options.files = value.split(",").map((item) => item.trim()).filter(Boolean);
      }
      continue;
    }

    files.push(arg);
  }

  return { ok: true, help: false, command, options, files };
}

function filesForRun({ parsed, projectConfig, cwd, changedFiles }) {
  let kind = "configured";
  let files;
  if (parsed.options.files?.length) {
    kind = "explicit";
    files = parsed.options.files;
  } else if (parsed.files.length > 0) {
    kind = "explicit";
    files = parsed.files;
  } else if (parsed.options.changed) {
    kind = "changed";
    try {
      files = changedFiles(cwd);
    } catch (error) {
      if (isAntiSlopInputError(error)) {
        throw error;
      }
      const detail = error instanceof Error ? error.message : String(error);
      throw new AntiSlopInputError("input", cwd, `Unable to determine changed files: ${detail}`);
    }
    if (!Array.isArray(files) || files.some((file) => typeof file !== "string")) {
      throw new AntiSlopInputError("input", cwd, "Unable to determine changed files: expected a string array.");
    }
  } else {
    files = projectConfig.files;
  }

  return { kind, files: applyIgnores(files, projectConfig.ignores) };
}

function applyIgnores(files, ignores) {
  if (ignores.length === 0) {
    return files;
  }

  const pathPatterns = ignores.filter((pattern) => pattern.includes("/"));
  const basenamePatterns = ignores.filter((pattern) => !pattern.includes("/"));
  const matchers = [];
  if (pathPatterns.length > 0) {
    matchers.push(picomatch(pathPatterns, { dot: true }));
  }
  if (basenamePatterns.length > 0) {
    matchers.push(picomatch(basenamePatterns, { dot: true, basename: true }));
  }

  return files.filter((file) => !matchers.some((isIgnored) => isIgnored(file)));
}

function defaultChangedFiles(cwd) {
  try {
    return execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    throw new AntiSlopInputError("input", cwd, "Unable to determine changed files from Git.");
  }
}

function defaultEslintRunner(cwd, projectConfig) {
  return async (files) => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd,
      errorOnUnmatchedPattern: false,
      overrideConfigFile: true,
      overrideConfig: antiSlopCliConfig(projectConfig),
    });
    return eslint.lintFiles(files);
  };
}

function antiSlopCliConfig(projectConfig) {
  return antiSlopAiosAuditConfig({ ignores: projectConfig.ignores });
}

function readBaseline(path) {
  if (!existsSync(path)) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new AntiSlopInputError("baseline", path, "must contain valid JSON.");
  }

  if (Array.isArray(parsed)) {
    return baselineFingerprints(parsed, path, false);
  }
  if (parsed === null || typeof parsed !== "object") {
    throw new AntiSlopInputError("baseline", path, "must be an array or an object with a findings array.");
  }

  const hasSchemaVersion = Object.hasOwn(parsed, "schemaVersion");
  const hasGate = Object.hasOwn(parsed, "gate");
  if (hasSchemaVersion !== hasGate) {
    throw new AntiSlopInputError("baseline", path, "schemaVersion and gate must be supplied together.");
  }
  if (hasSchemaVersion && (parsed.schemaVersion !== "1.0" || parsed.gate !== "Anti-Slop")) {
    throw new AntiSlopInputError("baseline", path, "schemaVersion must be \"1.0\" and gate must be \"Anti-Slop\".");
  }
  if (!Array.isArray(parsed.findings)) {
    throw new AntiSlopInputError("baseline", path, "\"findings\" must be an array.");
  }

  return baselineFingerprints(parsed.findings, path, true);
}

function baselineFingerprints(findings, path, allowObjects) {
  return findings.map((finding, index) => {
    const fingerprint = typeof finding === "string"
      ? finding
      : allowObjects && finding !== null && typeof finding === "object"
        ? finding.fingerprint
        : null;
    if (typeof fingerprint !== "string" || fingerprint.length === 0) {
      throw new AntiSlopInputError("baseline", path, `\"findings[${index}].fingerprint\" must be a non-empty string.`);
    }
    return fingerprint;
  });
}

function writeBaseline(path, findings) {
  writeOutput(path, JSON.stringify({
    schemaVersion: "1.0",
    gate: "Anti-Slop",
    findings: findings.map((finding) => ({
      fingerprint: finding.fingerprint,
      ruleId: finding.ruleId,
      file: finding.file,
      line: finding.line,
      message: finding.message,
    })),
  }, null, 2) + "\n");
}

function emitReport({ report, format, outputPath, cwd, stdout }) {
  if (outputPath) {
    writeOutput(resolve(cwd, outputPath), formatGateReport(report, "json"));
  }
  stdout(formatGateReport(report, format));
}

function writeOutput(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function inputErrorMessage(error, cwd) {
  if (isAntiSlopInputError(error)) {
    return error.message;
  }
  const detail = error instanceof Error ? error.message : String(error);
  return `Anti-Slop input error in ${cwd}: ${detail}`;
}

function analysisFailureMessage(errors) {
  return `Anti-Slop analysis failed: ${errors.map((error) => error.message).join(" ")}`;
}

function usage() {
  return [
    "Usage: anti-slop <check|gate> [files...] [options]",
    "",
    "Options:",
    "  --mode <auto|block|warn|audit>",
    "  --format <text|json|jsonl|pre-cr|sarif>",
    "  --changed",
    "  --files <comma,separated,files>",
    "  --baseline <path>",
    "  --update-baseline",
    "  --branch <name>",
  ].join("\n");
}
