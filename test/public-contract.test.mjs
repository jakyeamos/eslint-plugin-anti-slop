import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  accessSync,
  constants,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));
const repoRoot = dirname(packagePath);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const publicExportShapes = {
  ".": ["default"],
  "./audit": [
    "appendAuditEvents",
    "auditEventsFromEslintResults",
    "currentBranch",
    "dedupeFingerprint",
    "qualityGateDecision",
    "redactSecrets",
  ],
  "./aios-audit-config": [
    "aiosAuditArtifacts",
    "antiSlopAiosAuditConfig",
    "antiSlopAuditFormatter",
    "default",
    "defaultAntiSlopAuditIgnores",
  ],
  "./audit-formatter": ["default"],
  "./audit-formatter.mjs": ["default"],
  "./cli": ["runCli"],
  "./gate": [
    "antiSlopFindingsFromResults",
    "buildGateReport",
    "filterBaselineFindings",
    "formatGateReport",
    "readAntiSlopConfig",
    "sarifFromGateReport",
  ],
  "./rule-metadata": ["metadataForRule", "ruleMetadata"],
};

const publicExportKinds = {
  ".": { default: "object" },
  "./audit": {
    appendAuditEvents: "function",
    auditEventsFromEslintResults: "function",
    currentBranch: "function",
    dedupeFingerprint: "function",
    qualityGateDecision: "function",
    redactSecrets: "function",
  },
  "./aios-audit-config": {
    aiosAuditArtifacts: "object",
    antiSlopAiosAuditConfig: "function",
    antiSlopAuditFormatter: "string",
    default: "object",
    defaultAntiSlopAuditIgnores: "object",
  },
  "./audit-formatter": { default: "function" },
  "./audit-formatter.mjs": { default: "function" },
  "./cli": { runCli: "function" },
  "./gate": {
    antiSlopFindingsFromResults: "function",
    buildGateReport: "function",
    filterBaselineFindings: "function",
    formatGateReport: "function",
    readAntiSlopConfig: "function",
    sarifFromGateReport: "function",
  },
  "./rule-metadata": { metadataForRule: "function", ruleMetadata: "object" },
};

const gateEnvironmentKeys = [
  "AIOS_QUALITY_GATE_MODE",
  "QUALITY_GATE_MODE",
  "AIOS_DEV_ENVIRONMENT",
  "AIOS_DEV_ENV",
  "QUALITY_GATE_DEV_ENV",
  "GATE_CONNECTED_DEV_ENV",
  "VERCEL_ENV",
  "AIOS_BRANCH",
  "GITHUB_REF_NAME",
  "GITHUB_HEAD_REF",
  "BRANCH_NAME",
  "VERCEL_GIT_COMMIT_REF",
];

let loadedPublicModules;

async function publicModules() {
  if (loadedPublicModules) {
    return loadedPublicModules;
  }

  const modules = await Promise.all(
    Object.keys(publicExportShapes).map(async (subpath) => {
      const specifier = subpath === "." ? packageJson.name : `${packageJson.name}/${subpath.slice(2)}`;
      return [subpath, await import(specifier)];
    }),
  );
  loadedPublicModules = Object.fromEntries(modules);
  return loadedPublicModules;
}

function capture() {
  let stdout = "";
  let stderr = "";
  return {
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
    read: () => ({ stdout, stderr }),
  };
}

function antiSlopResult(repoRootForResult) {
  return [
    {
      filePath: join(repoRootForResult, "app", "page.tsx"),
      messages: [
        {
          ruleId: "anti-slop/no-placeholder-copy",
          severity: 2,
          message: "Placeholder copy detected.",
          line: 2,
          column: 3,
        },
      ],
    },
  ];
}

async function withoutGateEnvironment(callback) {
  const saved = new Map(gateEnvironmentKeys.map((key) => [key, process.env[key]]));

  try {
    for (const key of gateEnvironmentKeys) {
      delete process.env[key];
    }
    return await callback();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("public package contract", () => {
  it("keeps every declared package export importable with its intended API shape", async () => {
    assert.deepEqual(Object.keys(packageJson.exports).sort(), Object.keys(publicExportShapes).sort());

    const modules = await publicModules();
    for (const [subpath, expectedExports] of Object.entries(publicExportShapes)) {
      const target = packageJson.exports[subpath];
      assert.equal(typeof target, "string", `${subpath} must map to one entrypoint file`);
      assert.equal(existsSync(resolve(repoRoot, target)), true, `${subpath} target must exist`);
      assert.deepEqual(Object.keys(modules[subpath]).sort(), expectedExports.sort(), `${subpath} export names`);

      for (const [exportName, expectedType] of Object.entries(publicExportKinds[subpath])) {
        assert.equal(typeof modules[subpath][exportName], expectedType, `${subpath} ${exportName} type`);
      }
    }

    const plugin = modules["."].default;
    const auditConfig = modules["./aios-audit-config"];
    assert.equal(plugin.meta.name, packageJson.name);
    assert.equal(plugin.meta.version, packageJson.version);
    assert.equal(plugin.meta.namespace, "anti-slop");
    assert.equal(Array.isArray(auditConfig.default), true);
    assert.equal(Array.isArray(auditConfig.aiosAuditArtifacts), true);
    assert.equal(Array.isArray(auditConfig.defaultAntiSlopAuditIgnores), true);
    assert.equal(modules["./audit-formatter"].default, modules["./audit-formatter.mjs"].default);
  });

  it("ships an executable anti-slop bin target", () => {
    assert.deepEqual(Object.keys(packageJson.bin), ["anti-slop"]);

    const binPath = resolve(repoRoot, packageJson.bin["anti-slop"]);
    assert.equal(existsSync(binPath), true);
    assert.equal(statSync(binPath).isFile(), true);
    assert.notEqual(statSync(binPath).mode & 0o111, 0);
    assert.doesNotThrow(() => accessSync(binPath, constants.X_OK));
    assert.match(readFileSync(binPath, "utf8"), /^#!\/usr\/bin\/env node\n/);
  });

  it("keeps rules, preset severities, metadata, and documentation in parity", async () => {
    const modules = await publicModules();
    const plugin = modules["."].default;
    const metadata = modules["./rule-metadata"].ruleMetadata;
    const ruleIds = Object.keys(metadata).sort();
    const pluginRuleIds = Object.keys(plugin.rules).map((ruleName) => `anti-slop/${ruleName}`).sort();

    assert.deepEqual(pluginRuleIds, ruleIds);
    assert.deepEqual(Object.keys(plugin.configs.recommended.rules).sort(), ruleIds);
    assert.deepEqual(Object.keys(plugin.configs.strict.rules).sort(), ruleIds);
    assert.equal(plugin.configs.recommended.plugins["anti-slop"], plugin);
    assert.equal(plugin.configs.strict.plugins["anti-slop"], plugin);

    for (const ruleId of ruleIds) {
      const ruleName = ruleId.replace("anti-slop/", "");
      const rule = plugin.rules[ruleName];
      const ruleMetadata = metadata[ruleId];
      const documentPath = join(repoRoot, "docs", "rules", `${ruleName}.md`);

      assert.equal(plugin.configs.recommended.rules[ruleId], ruleMetadata.recommendedSeverity);
      assert.equal(plugin.configs.strict.rules[ruleId], ruleMetadata.strictSeverity);
      assert.ok(["warn", "error"].includes(ruleMetadata.recommendedSeverity));
      assert.ok(["warn", "error"].includes(ruleMetadata.strictSeverity));
      assert.equal(typeof rule.create, "function");
      assert.equal(rule.meta.docs.url, `https://github.com/jakyeamos/eslint-plugin-anti-slop/blob/main/docs/rules/${ruleName}.md`);
      assert.equal(existsSync(documentPath), true, `${ruleId} documentation must exist`);
      assert.match(readFileSync(documentPath, "utf8"), new RegExp(`^# ${ruleId.replace("/", "\\/")}(?:\\n|$)`));
    }

    const documentedRuleIds = readdirSync(join(repoRoot, "docs", "rules"))
      .filter((file) => file.endsWith(".md"))
      .map((file) => readFileSync(join(repoRoot, "docs", "rules", file), "utf8").match(/^# (anti-slop\/[^\n]+)/)?.[1])
      .filter(Boolean)
      .sort();
    assert.deepEqual(documentedRuleIds, ruleIds);

    const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
    const rulesSection = readme.slice(readme.indexOf("## Rules"), readme.indexOf("### `anti-slop/"));
    const readmeRuleIds = [...rulesSection.matchAll(/`(anti-slop\/[^`]+)`/g)].map((match) => match[1]).sort();
    assert.deepEqual(readmeRuleIds, ruleIds);
  });

  it("writes the declared audit artifacts with the published event envelope", async () => {
    await withoutGateEnvironment(async () => {
      const modules = await publicModules();
      const { aiosAuditArtifacts } = modules["./aios-audit-config"];
      const formatAuditResults = modules["./audit-formatter"].default;
      const auditRoot = mkdtempSync(join(tmpdir(), "anti-slop-public-audit-"));

      try {
        assert.match(
          formatAuditResults(antiSlopResult(auditRoot), { cwd: auditRoot }),
          /Anti-Slop audit events: 1/,
        );

        assert.deepEqual(aiosAuditArtifacts, [
          ".aios/audit/gate-events.jsonl",
          ".aios/audit/gate-summary.md",
          ".aios/audit/learning-lessons.md",
        ]);
        for (const artifactPath of aiosAuditArtifacts) {
          assert.equal(existsSync(join(auditRoot, artifactPath)), true, `${artifactPath} must be written`);
        }

        const event = JSON.parse(readFileSync(join(auditRoot, aiosAuditArtifacts[0]), "utf8"));
        assert.deepEqual(Object.keys(event).sort(), [
          "actual_fix",
          "actor_type",
          "blocked_duration_seconds",
          "branch",
          "category",
          "commit_sha",
          "decision",
          "dedupe_fingerprint",
          "event_id",
          "event_type",
          "evidence",
          "failure_pattern",
          "gate",
          "gate_version",
          "learning_lesson",
          "notes",
          "related_event_ids",
          "repo",
          "required_fix",
          "root_cause_hypothesis",
          "rule_id",
          "rule_name",
          "run_id",
          "schema_version",
          "severity",
          "summary",
          "timestamp",
          "tokens_wasted_estimate",
        ].sort());
        assert.equal(event.schema_version, "1.1");
        assert.equal(event.gate, "Anti-Slop");
        assert.equal(event.decision, "block");
        assert.equal(event.rule_id, "anti-slop/no-placeholder-copy");
        assert.match(event.event_id, /^[a-f0-9-]{36}$/);
        assert.match(event.timestamp, /^\d{4}-\d{2}-\d{2}T/);
        assert.deepEqual(Object.keys(event.evidence[0]).sort(), ["file", "line_end", "line_start", "reason"]);
        assert.equal(event.evidence[0].file, "app/page.tsx");
        assert.equal(typeof event.dedupe_fingerprint, "string");
        assert.equal(Array.isArray(event.related_event_ids), true);
        assert.match(readFileSync(join(auditRoot, aiosAuditArtifacts[1]), "utf8"), /# Gate Audit Summary/);
        assert.match(readFileSync(join(auditRoot, aiosAuditArtifacts[2]), "utf8"), /# Gate Learning Lessons/);
      } finally {
        rmSync(auditRoot, { recursive: true, force: true });
      }
    });
  });

  it("preserves the current CLI mode and format contracts", async () => {
    await withoutGateEnvironment(async () => {
      const { runCli } = (await publicModules())["./cli"];
      const cliRoot = mkdtempSync(join(tmpdir(), "anti-slop-public-cli-"));

      try {
        const modeCases = [
          { mode: "auto", branch: "feature/contract", exitCode: 0, reportMode: "auto", effectiveMode: "warn", decision: "warn" },
          { mode: "block", branch: "feature/contract", exitCode: 1, reportMode: "block", effectiveMode: "block", decision: "block" },
          { mode: "warn", branch: "feature/contract", exitCode: 0, reportMode: "warn", effectiveMode: "warn", decision: "warn" },
          { mode: "audit", branch: "feature/contract", exitCode: 0, reportMode: "audit", effectiveMode: "warn", decision: "warn" },
        ];

        for (const expected of modeCases) {
          const io = capture();
          const exitCode = await runCli(["check", "--mode", expected.mode, "--format", "json", "--branch", expected.branch], {
            cwd: cliRoot,
            stdout: io.stdout,
            stderr: io.stderr,
            eslintRunner: async () => antiSlopResult(cliRoot),
          });
          const report = JSON.parse(io.read().stdout);

          assert.equal(exitCode, expected.exitCode, `${expected.mode} exit code`);
          assert.equal(report.mode, expected.reportMode, `${expected.mode} report mode`);
          assert.equal(report.effectiveMode, expected.effectiveMode, `${expected.mode} effective mode`);
          assert.equal(report.decision, expected.decision, `${expected.mode} decision`);
        }

        for (const format of ["text", "json", "jsonl", "pre-cr", "sarif"]) {
          const io = capture();
          const exitCode = await runCli(["check", "--mode", "block", "--format", format, "--branch", "main"], {
            cwd: cliRoot,
            stdout: io.stdout,
            stderr: io.stderr,
            eslintRunner: async () => antiSlopResult(cliRoot),
          });
          const { stdout } = io.read();

          assert.equal(exitCode, 1, `${format} block-mode exit code`);
          assert.match(stdout, /\n$/);
          if (format === "text") {
            assert.match(stdout, /Anti-Slop gate blocked/);
          } else if (format === "json") {
            assert.equal(JSON.parse(stdout).schemaVersion, "1.1");
          } else if (format === "sarif") {
            assert.equal(JSON.parse(stdout).version, "2.1.0");
          } else {
            const finding = JSON.parse(stdout.trim());
            assert.equal(finding.gate, "Anti-Slop");
            assert.equal(finding.rule_id, "anti-slop/no-placeholder-copy");
          }
        }

        const defaultGateIo = capture();
        const defaultGateExitCode = await runCli(["gate", "--mode", "warn", "--branch", "feature/contract"], {
          cwd: cliRoot,
          stdout: defaultGateIo.stdout,
          stderr: defaultGateIo.stderr,
          eslintRunner: async () => antiSlopResult(cliRoot),
        });
        assert.equal(defaultGateExitCode, 0);
        assert.equal(JSON.parse(defaultGateIo.read().stdout).mode, "warn");
      } finally {
        rmSync(cliRoot, { recursive: true, force: true });
      }
    });
  });

  it("writes and applies a baseline through the public CLI", async () => {
    const { runCli } = (await publicModules())["./cli"];
    const cliRoot = mkdtempSync(join(tmpdir(), "anti-slop-public-baseline-"));
    const baselinePath = ".anti-slop-baseline.json";

    try {
      const updateIo = capture();
      const updateExitCode = await runCli(["check", "--update-baseline", "--baseline", baselinePath], {
        cwd: cliRoot,
        stdout: updateIo.stdout,
        stderr: updateIo.stderr,
        eslintRunner: async () => antiSlopResult(cliRoot),
      });
      const baseline = JSON.parse(readFileSync(join(cliRoot, baselinePath), "utf8"));

      assert.equal(updateExitCode, 0);
      assert.match(updateIo.read().stdout, /Updated Anti-Slop baseline with 1 finding/);
      assert.equal(baseline.schemaVersion, "1.0");
      assert.equal(baseline.gate, "Anti-Slop");
      assert.equal(baseline.findings.length, 1);
      assert.deepEqual(Object.keys(baseline.findings[0]).sort(), ["file", "fingerprint", "line", "message", "ruleId"]);

      const gateIo = capture();
      const gateExitCode = await runCli(["gate", "--mode", "block", "--format", "json", "--baseline", baselinePath], {
        cwd: cliRoot,
        stdout: gateIo.stdout,
        stderr: gateIo.stderr,
        eslintRunner: async () => antiSlopResult(cliRoot),
      });
      const report = JSON.parse(gateIo.read().stdout);

      assert.equal(gateExitCode, 0);
      assert.equal(report.decision, "pass");
      assert.equal(report.newFindings.length, 0);
      assert.equal(report.baselinedFindings.length, 1);
    } finally {
      rmSync(cliRoot, { recursive: true, force: true });
    }
  });
});
