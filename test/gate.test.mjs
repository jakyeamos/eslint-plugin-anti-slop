import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  antiSlopFindingsFromResults,
  buildGateReport,
  filterBaselineFindings,
  formatGateReport,
  readAntiSlopConfig,
  sarifFromGateReport,
} from "../src/gate.mjs";
import { ruleMetadata } from "../src/rule-metadata.mjs";

const resultWithMessages = {
  filePath: "/repo/app/page.tsx",
  messages: [
    {
      ruleId: "anti-slop/no-placeholder-copy",
      severity: 2,
      message: "Placeholder copy detected.",
      line: 4,
      column: 7,
    },
    {
      ruleId: "anti-slop/no-marketing-copy",
      severity: 1,
      message: "Marketing copy detected.",
      line: 8,
      column: 3,
    },
    {
      ruleId: "react/jsx-key",
      severity: 2,
      message: "Not this gate.",
      line: 12,
      column: 2,
    },
  ],
};

describe("ruleMetadata", () => {
  it("keeps gate remediation with rule metadata", () => {
    assert.equal(
      ruleMetadata["anti-slop/no-defensive-guard-sprawl"].requiredFix,
      "Move repeated shape checks into a centralized validator or type guard.",
    );
    assert.equal(ruleMetadata["anti-slop/no-placeholder-copy"].category, "UX");
    assert.equal(ruleMetadata["anti-slop/no-placeholder-copy"].recommendedSeverity, "error");
  });
});

describe("antiSlopFindingsFromResults", () => {
  it("normalizes anti-slop ESLint messages and ignores unrelated rules", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });

    assert.equal(findings.length, 2);
    assert.equal(findings[0].ruleId, "anti-slop/no-placeholder-copy");
    assert.equal(findings[0].file, "app/page.tsx");
    assert.equal(findings[0].severity, "error");
    assert.equal(findings[0].requiredFix, "Replace placeholder copy with real product text.");
    assert.match(findings[0].fingerprint, /^[a-f0-9]{24}$/);
    assert.equal(findings[1].severity, "warning");
  });

  it("gives distinct fingerprints to separate findings of the same rule in one file", () => {
    const source = [
      "export function Page() {",
      "  return (",
      "    <section>",
      "      <p>Coming soon</p>",
      "      <p>Lorem ipsum</p>",
      "    </section>",
      "  );",
      "}",
    ].join("\n");
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [
        {
          filePath: "/repo/app/page.tsx",
          source,
          messages: [
            { ruleId: "anti-slop/no-placeholder-copy", severity: 2, message: "Placeholder copy detected.", line: 4, column: 7 },
            { ruleId: "anti-slop/no-placeholder-copy", severity: 2, message: "Placeholder copy detected.", line: 5, column: 7 },
          ],
        },
      ],
    });

    assert.equal(findings.length, 2);
    assert.notEqual(findings[0].fingerprint, findings[1].fingerprint);
  });

  it("keeps fingerprints stable when a finding's line shifts but its code does not change", () => {
    const makeResult = (line, leadingLines) => ({
      filePath: "/repo/app/page.tsx",
      source: [...Array.from({ length: leadingLines }, (_, i) => `// filler ${i}`), "      <p>Coming soon</p>"].join("\n"),
      messages: [
        { ruleId: "anti-slop/no-placeholder-copy", severity: 2, message: "Placeholder copy detected.", line, column: 7 },
      ],
    });

    const [before] = antiSlopFindingsFromResults({ repoRoot: "/repo", results: [makeResult(3, 2)] });
    const [after] = antiSlopFindingsFromResults({ repoRoot: "/repo", results: [makeResult(6, 5)] });

    assert.equal(before.fingerprint, after.fingerprint);
  });
});

describe("buildGateReport", () => {
  it("blocks on error findings in block mode", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });

    const report = buildGateReport({ findings, mode: "block", branch: "feature/test" });

    assert.equal(report.decision, "block");
    assert.equal(report.exitCode, 1);
    assert.equal(report.newFindings.length, 2);
  });

  it("warns without blocking in warn mode", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });

    const report = buildGateReport({ findings, mode: "warn", branch: "main" });

    assert.equal(report.decision, "warn");
    assert.equal(report.exitCode, 0);
  });

  it("passes when every finding is covered by the baseline", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });

    const report = buildGateReport({
      findings,
      mode: "block",
      baseline: findings.map((finding) => finding.fingerprint),
    });

    assert.equal(report.decision, "pass");
    assert.equal(report.exitCode, 0);
    assert.equal(report.baselinedFindings.length, 2);
    assert.equal(report.newFindings.length, 0);
  });

  it("keeps requested audit mode separate from effective enforcement policy", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });

    const report = buildGateReport({ findings, mode: "audit", branch: "main" });

    assert.equal(report.mode, "audit");
    assert.equal(report.effectiveMode, "warn");
    assert.equal(report.decision, "warn");
    assert.equal(report.exitCode, 0);
    assert.equal(report.analysis.status, "complete");
  });

  it("models skipped and failed analysis separately from gate findings", () => {
    const skipped = buildGateReport({
      findings: [],
      mode: "block",
      analysis: { status: "skipped", selection: "changed", files: [], errors: [] },
    });
    const failed = buildGateReport({
      findings: [],
      mode: "audit",
      analysis: {
        status: "failed",
        selection: "explicit",
        files: ["app/page.tsx"],
        errors: [{ kind: "parser", file: "app/page.tsx", line: 2, column: 5, message: "Parsing error" }],
      },
    });

    assert.equal(skipped.decision, "skipped");
    assert.equal(skipped.exitCode, 0);
    assert.equal(failed.mode, "audit");
    assert.equal(failed.effectiveMode, "warn");
    assert.equal(failed.decision, "error");
    assert.equal(failed.exitCode, 1);
  });
});

describe("filterBaselineFindings", () => {
  it("splits new findings from baseline fingerprints", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });

    const filtered = filterBaselineFindings(findings, [findings[0].fingerprint]);

    assert.deepEqual(filtered.newFindings, [findings[1]]);
    assert.deepEqual(filtered.baselinedFindings, [findings[0]]);
  });
});

describe("formatGateReport", () => {
  it("emits text, json, jsonl, and pre-cr formats", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });
    const report = buildGateReport({ findings, mode: "block" });

    assert.match(formatGateReport(report, "text"), /Anti-Slop gate blocked/);
    assert.equal(JSON.parse(formatGateReport(report, "json")).newFindings.length, 2);
    assert.equal(formatGateReport(report, "jsonl").trim().split("\n").length, 2);
    assert.match(formatGateReport(report, "pre-cr"), /"gate":"Anti-Slop"/);
  });

  it("makes skipped and failed analysis visible in every machine-readable format", () => {
    const skipped = buildGateReport({
      findings: [],
      mode: "block",
      analysis: {
        status: "skipped",
        selection: "changed",
        files: [],
        errors: [],
      },
    });
    const failed = buildGateReport({
      findings: [],
      mode: "block",
      analysis: {
        status: "failed",
        selection: "configured",
        files: ["."],
        errors: [{ kind: "eslint", file: null, line: null, column: null, message: "Runner failed" }],
      },
    });

    assert.match(formatGateReport(failed, "text"), /analysis failed/i);
    assert.equal(JSON.parse(formatGateReport(failed, "json")).analysis.status, "failed");
    assert.equal(JSON.parse(formatGateReport(failed, "jsonl")).record_type, "analysis_failed");
    assert.equal(JSON.parse(formatGateReport(failed, "pre-cr")).record_type, "analysis_failed");
    assert.match(JSON.stringify(sarifFromGateReport(failed)), /analysis-failure/);
    assert.equal(JSON.parse(formatGateReport(skipped, "jsonl")).record_type, "analysis_skipped");
    assert.match(JSON.stringify(sarifFromGateReport(skipped)), /analysis-skipped/);
  });
});

describe("sarifFromGateReport", () => {
  it("emits SARIF with anti-slop rules and results", () => {
    const findings = antiSlopFindingsFromResults({
      repoRoot: "/repo",
      results: [resultWithMessages],
    });
    const sarif = sarifFromGateReport(buildGateReport({ findings, mode: "block" }));

    assert.equal(sarif.version, "2.1.0");
    assert.equal(sarif.runs[0].tool.driver.name, "eslint-plugin-anti-slop");
    assert.equal(sarif.runs[0].results.length, 2);
  });
});

describe("readAntiSlopConfig", () => {
  it("loads project gate settings from anti-slop.config.json", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-config-"));

    try {
      writeFileSync(
        join(repoRoot, "anti-slop.config.json"),
        JSON.stringify({
          files: ["src/**/*.ts"],
          ignores: ["dist/**"],
          mode: "warn",
          baselinePath: ".anti-slop-baseline.json",
          outputPath: ".aios/audit/anti-slop.json",
        }),
        "utf8",
      );

      assert.deepEqual(readAntiSlopConfig(repoRoot), {
        files: ["src/**/*.ts"],
        ignores: ["dist/**"],
        mode: "warn",
        baselinePath: ".anti-slop-baseline.json",
        outputPath: ".aios/audit/anti-slop.json",
      });
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("returns stable defaults when no project config exists", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-config-empty-"));

    try {
      assert.deepEqual(readAntiSlopConfig(repoRoot), {
        files: ["."],
        ignores: [],
        mode: "auto",
        baselinePath: ".anti-slop-baseline.json",
        outputPath: null,
      });
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("validates project config keys and field shapes", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-config-invalid-"));
    const invalidConfigs = [
      { value: [], pattern: /must contain an object/ },
      { value: { unknown: true }, pattern: /Unknown configuration field/ },
      { value: { mode: "invalid" }, pattern: /mode/ },
      { value: { files: "src" }, pattern: /files/ },
      { value: { files: [] }, pattern: /files/ },
      { value: { ignores: ["dist/**", 1] }, pattern: /ignores/ },
      { value: { baselinePath: "" }, pattern: /baselinePath/ },
      { value: { baselinePath: "reports/../../outside.json" }, pattern: /baselinePath.*project root/ },
      { value: { baselinePath: join(tmpdir(), "anti-slop-outside.json") }, pattern: /baselinePath.*project root/ },
      { value: { outputPath: 42 }, pattern: /outputPath/ },
      { value: { outputPath: "reports/../../outside.json" }, pattern: /outputPath.*project root/ },
      { value: { outputPath: join(tmpdir(), "anti-slop-outside.json") }, pattern: /outputPath.*project root/ },
    ];

    try {
      for (const { value, pattern } of invalidConfigs) {
        writeFileSync(join(repoRoot, "anti-slop.config.json"), JSON.stringify(value), "utf8");
        assert.throws(() => readAntiSlopConfig(repoRoot), pattern);
      }

      writeFileSync(join(repoRoot, "anti-slop.config.json"), JSON.stringify({ mode: "audit" }), "utf8");
      assert.deepEqual(readAntiSlopConfig(repoRoot), {
        files: ["."],
        ignores: [],
        mode: "audit",
        baselinePath: ".anti-slop-baseline.json",
        outputPath: null,
      });
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects configured paths that escape through symlinks", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-config-symlink-"));
    const outsideRoot = mkdtempSync(join(tmpdir(), "anti-slop-config-outside-"));
    const configPath = join(repoRoot, "anti-slop.config.json");

    try {
      symlinkSync(outsideRoot, join(repoRoot, "reports"), "dir");

      for (const value of [
        { outputPath: "reports/gate.json" },
        { baselinePath: "reports/baseline.json" },
      ]) {
        writeFileSync(configPath, JSON.stringify(value), "utf8");
        assert.throws(() => readAntiSlopConfig(repoRoot), /project root/);
      }

      mkdirSync(join(repoRoot, "files"));
      symlinkSync(join(outsideRoot, "gate.json"), join(repoRoot, "files", "gate.json"));
      writeFileSync(configPath, JSON.stringify({ outputPath: "files/gate.json" }), "utf8");
      assert.throws(() => readAntiSlopConfig(repoRoot), /outputPath.*project root/);

      rmSync(configPath, { force: true });
      symlinkSync(join(outsideRoot, "baseline.json"), join(repoRoot, ".anti-slop-baseline.json"));
      assert.throws(() => readAntiSlopConfig(repoRoot), /baselinePath.*project root/);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
      rmSync(outsideRoot, { recursive: true, force: true });
    }
  });
});
