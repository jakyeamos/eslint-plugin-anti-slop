import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import picomatch from "picomatch";
import { antiSlopAiosAuditConfig } from "./aios-audit-config.mjs";
import { currentBranch } from "./audit.mjs";
import {
  antiSlopFindingsFromResults,
  buildGateReport,
  formatGateReport,
  readAntiSlopConfig,
} from "./gate.mjs";

const VALID_COMMANDS = new Set(["check", "gate"]);
const VALID_FORMATS = new Set(["text", "json", "jsonl", "pre-cr", "sarif"]);
const VALID_MODES = new Set(["auto", "block", "warn", "audit"]);

export async function runCli(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? ((text) => process.stdout.write(text));
  const stderr = dependencies.stderr ?? ((text) => process.stderr.write(text));
  const cwd = dependencies.cwd ?? process.cwd();
  const parsed = parseArgs(argv);

  if (!parsed.ok) {
    stderr(`${usage()}\n${parsed.error}\n`);
    return 2;
  }

  const projectConfig = readAntiSlopConfig(cwd);
  const mode = parsed.options.mode ?? projectConfig.mode;
  const format = parsed.options.format ?? (parsed.command === "gate" ? "pre-cr" : "text");
  const baselinePath = parsed.options.baseline ?? projectConfig.baselinePath;
  const files = filesForRun({
    parsed,
    projectConfig,
    cwd,
    changedFiles: dependencies.changedFiles ?? defaultChangedFiles,
  });

  const eslintRunner = dependencies.eslintRunner ?? defaultEslintRunner(cwd, projectConfig);
  const results = await eslintRunner(files, { cwd, ignores: projectConfig.ignores });
  const findings = antiSlopFindingsFromResults({ repoRoot: cwd, results });
  const baseline = readBaseline(resolve(cwd, baselinePath));
  const report = buildGateReport({
    findings,
    mode: mode === "audit" ? "warn" : mode,
    branch: parsed.options.branch ?? currentBranch(cwd),
    baseline,
    repoRoot: cwd,
  });

  if (parsed.options.updateBaseline) {
    writeBaseline(resolve(cwd, baselinePath), findings);
    stdout(`Updated Anti-Slop baseline with ${findings.length} finding(s) at ${baselinePath}\n`);
    return 0;
  }

  if (projectConfig.outputPath) {
    writeOutput(resolve(cwd, projectConfig.outputPath), formatGateReport(report, "json"));
  }

  stdout(formatGateReport(report, format));
  return mode === "audit" ? 0 : report.exitCode;
}

function parseArgs(argv) {
  const [command = "check", ...rest] = argv;
  if (!VALID_COMMANDS.has(command) || rest.includes("--help") || rest.includes("-h")) {
    return VALID_COMMANDS.has(command) && (rest.includes("--help") || rest.includes("-h"))
      ? { ok: false, error: "" }
      : { ok: false, error: `Unknown command: ${command}` };
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

  return { ok: true, command, options, files };
}

function filesForRun({ parsed, projectConfig, cwd, changedFiles }) {
  let files;
  if (parsed.options.files?.length) {
    files = parsed.options.files;
  } else if (parsed.files.length > 0) {
    files = parsed.files;
  } else if (parsed.options.changed) {
    const changed = changedFiles(cwd);
    files = changed.length > 0 ? changed : projectConfig.files;
  } else {
    files = projectConfig.files;
  }

  return applyIgnores(files, projectConfig.ignores);
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
    return [];
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

  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (Array.isArray(parsed)) {
    return parsed;
  }

  return (parsed.findings ?? []).map((finding) => typeof finding === "string" ? finding : finding.fingerprint).filter(Boolean);
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

function writeOutput(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
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
