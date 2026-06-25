import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
});
