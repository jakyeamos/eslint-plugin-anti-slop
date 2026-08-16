import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import aiosAuditConfig, {
  aiosAuditArtifacts,
  antiSlopAiosAuditConfig,
  antiSlopAuditFormatter,
} from "../src/aios-audit-config.mjs";
import {
  appendAuditEvents,
  auditEventsFromEslintResults,
  dedupeFingerprint,
  redactSecrets,
} from "../src/audit.mjs";
import formatAuditResults from "../src/audit-formatter.mjs";
import { antiSlopFindingsFromResults } from "../src/gate.mjs";

describe("AIOS audit integration surface", () => {
  it("exports a packaged formatter name, artifact paths, and consumer flat config", () => {
    const config = antiSlopAiosAuditConfig({ ignores: ["vendor/**"] });

    assert.equal(antiSlopAuditFormatter, "./node_modules/eslint-plugin-anti-slop/audit-formatter.mjs");
    assert.deepEqual(aiosAuditArtifacts, [
      ".aios/audit/gate-events.jsonl",
      ".aios/audit/gate-summary.md",
      ".aios/audit/learning-lessons.md",
    ]);
    assert.equal(Array.isArray(aiosAuditConfig), true);
    assert.deepEqual(config[0].ignores, [
      "**/.next/**",
      "**/build/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "vendor/**",
    ]);
    assert.deepEqual(config[1].files, ["**/*.{js,jsx,mjs,cjs}"]);
    assert.deepEqual(config[2].files, ["**/*.{ts,tsx,mts,cts}"]);
    assert.equal(config[1].rules["anti-slop/no-placeholder-copy"], "error");
    assert.equal(config[2].rules["anti-slop/no-placeholder-copy"], "error");
  });

  it("selects the evidence preset rules without changing the recommended default", () => {
    const recommended = antiSlopAiosAuditConfig();
    const evidence = antiSlopAiosAuditConfig({ preset: "evidence" });

    assert.equal(recommended[2].rules["anti-slop/no-known-value-widening"], undefined);
    assert.deepEqual(Object.keys(evidence[2].rules).sort(), [
      "anti-slop/no-known-value-widening",
      "anti-slop/no-widen-then-assert",
      "anti-slop/require-safety-comment-for-type-assertion",
    ]);
    assert.deepEqual(Object.keys(evidence[1].rules).sort(), Object.keys(evidence[2].rules).sort());
  });

  it("declares the reusable audit config as a package export", () => {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

    assert.equal(packageJson.exports["./aios-audit-config"], "./src/aios-audit-config.mjs");
  });

  it("ships a root formatter file for ESLint CLI path loading", async () => {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const formatterModule = await import("../audit-formatter.mjs");

    assert.equal(packageJson.exports["./audit-formatter.mjs"], "./audit-formatter.mjs");
    assert.equal(packageJson.files.includes("audit-formatter.mjs"), true);
    assert.equal(formatterModule.default, formatAuditResults);
  });
});

describe("auditEventsFromEslintResults", () => {
  it("creates Anti-Slop events for blocking ESLint messages", () => {
    const events = auditEventsFromEslintResults({
      repoRoot: "/repo",
      branch: "main",
      results: [
        {
          filePath: "/repo/app/page.tsx",
          messages: [
            {
              ruleId: "anti-slop/no-placeholder-copy",
              severity: 2,
              message: 'Placeholder copy detected: apiKey = "sk_live_1234567890abcdef".',
              line: 8,
              column: 3,
            },
          ],
        },
      ],
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].schema_version, "1.1");
    assert.equal(events[0].gate, "Anti-Slop");
    assert.equal(events[0].event_type, "commit_blocked");
    assert.equal(events[0].rule_id, "anti-slop/no-placeholder-copy");
    assert.equal(events[0].evidence[0].file, "app/page.tsx");
    assert.equal(events[0].evidence[0].line_start, 8);
    assert.match(events[0].summary, /Anti-Slop blocked/);
    assert.doesNotMatch(events[0].summary, /sk_live_/);
    assert.match(events[0].learning_lesson, /anti-slop/);
  });

  it("creates warning events for unprotected branches", () => {
    const events = auditEventsFromEslintResults({
      repoRoot: "/repo",
      branch: "feature/hoopscout",
      results: [
        {
          filePath: "/repo/app/page.tsx",
          messages: [
            {
              ruleId: "anti-slop/no-placeholder-copy",
              severity: 2,
              message: "Placeholder copy detected.",
              line: 8,
              column: 3,
            },
          ],
        },
      ],
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].branch, "feature/hoopscout");
    assert.equal(events[0].decision, "warn");
    assert.equal(events[0].severity, "warning");
    assert.equal(events[0].event_type, "finding_observed");
    assert.match(events[0].summary, /warning only/);
  });

  it("uses the same finding identity as the gate", () => {
    const repoRoot = "/repo";
    const results = [
      {
        filePath: "/repo/app/page.tsx",
        source: "export function Page() {\n  return <p>TODO</p>;\n}\n",
        messages: [
          {
            ruleId: "anti-slop/no-placeholder-copy",
            severity: 2,
            message: "Placeholder copy detected.",
            line: 2,
            column: 10,
          },
        ],
      },
    ];

    const [finding] = antiSlopFindingsFromResults({ repoRoot, results });
    const [event] = auditEventsFromEslintResults({ repoRoot, branch: "main", results });

    assert.equal(event.dedupe_fingerprint, finding.fingerprint);
    assert.equal(event.failure_pattern, finding.failurePattern);
  });

  it("ignores non-blocking and non-Anti-Slop messages", () => {
    const events = auditEventsFromEslintResults({
      repoRoot: "/repo",
      results: [
        {
          filePath: "/repo/app/page.tsx",
          messages: [
            { ruleId: "anti-slop/no-placeholder-copy", severity: 1, message: "warn only" },
            { ruleId: "react/no-array-index-key", severity: 2, message: "not this gate" },
          ],
        },
      ],
    });

    assert.deepEqual(events, []);
  });

  it("uses fallback rule guidance for unknown Anti-Slop rules", () => {
    const events = auditEventsFromEslintResults({
      repoRoot: "/repo",
      runId: "run-1",
      results: [
        {
          filePath: "/repo/app/page.tsx",
          messages: [
            {
              ruleId: "anti-slop/custom-rule",
              severity: 2,
              message: "custom failure",
              line: 2,
              endLine: 4,
            },
          ],
        },
      ],
    });

    assert.equal(events[0].run_id, "run-1");
    assert.equal(events[0].evidence[0].line_end, 4);
    assert.equal(events[0].failure_pattern, "anti-slop custom rule");
    assert.equal(events[0].required_fix, "Fix the anti-slop rule violation before committing.");
  });
});

describe("dedupeFingerprint", () => {
  it("is stable for the same gate, rule, files, and pattern", () => {
    assert.equal(
      dedupeFingerprint("Anti-Slop", "anti-slop/no-placeholder-copy", ["app/page.tsx"], "placeholder copy"),
      dedupeFingerprint("Anti-Slop", "anti-slop/no-placeholder-copy", ["app/page.tsx"], "placeholder copy"),
    );
  });
});

describe("redactSecrets", () => {
  it("redacts common key, token, password, and secret assignments", () => {
    const token = ["ghp", "_", "1234567890abcdef"].join("");
    const password = ["correct", "horse", "battery"].join("-");
    const text = `token = "${token}" password: "${password}"`;

    const redacted = redactSecrets(text);

    assert.equal(redacted.includes(token), false);
    assert.equal(redacted.includes(password), false);
    assert.match(redacted, /\[REDACTED\]/);
  });
});

describe("appendAuditEvents", () => {
  it("does nothing for an empty event list", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-audit-empty-"));

    try {
      appendAuditEvents(repoRoot, []);

      assert.throws(() => readFileSync(join(repoRoot, ".aios", "audit", "gate-events.jsonl"), "utf8"));
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes jsonl, summary, and lessons with repeated patterns", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-audit-"));
    const events = auditEventsFromEslintResults({
      repoRoot,
      branch: "main",
      results: [
        {
          filePath: join(repoRoot, "app", "page.tsx"),
          source: [
            "export function Page() {",
            "  return <section>",
            "    <p>Supercharge now</p>",
            "    <p>Supercharge now</p>",
            "    <p>Supercharge now</p>",
            "  </section>;",
            "}",
          ].join("\n"),
          messages: [
            {
              ruleId: "anti-slop/no-marketing-copy",
              severity: 2,
              message: "Generic marketing copy detected.",
              line: 3,
            },
            {
              ruleId: "anti-slop/no-marketing-copy",
              severity: 2,
              message: "Generic marketing copy detected again.",
              line: 5,
            },
          ],
        },
      ],
    });

    try {
      appendAuditEvents(repoRoot, events);

      const auditDir = join(repoRoot, ".aios", "audit");
      const jsonl = readFileSync(join(auditDir, "gate-events.jsonl"), "utf8");
      const summary = readFileSync(join(auditDir, "gate-summary.md"), "utf8");
      const lessons = readFileSync(join(auditDir, "learning-lessons.md"), "utf8");

      assert.equal(jsonl.trim().split("\n").length, 2);
      assert.match(summary, /Pattern: anti-slop no marketing copy/);
      assert.match(summary, /not ready to commit/);
      assert.match(lessons, /Current repo-specific rules learned/);
      assert.match(lessons, /Replace generic marketing language/);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("keeps legacy and current fingerprint histories in separate schema buckets", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-audit-schema-"));
    const [currentEvent] = auditEventsFromEslintResults({
      repoRoot,
      branch: "main",
      results: [
        {
          filePath: join(repoRoot, "app", "page.tsx"),
          source: "export function Page() {\n  return <p>TODO</p>;\n}\n",
          messages: [
            {
              ruleId: "anti-slop/no-placeholder-copy",
              severity: 2,
              message: "Placeholder copy detected.",
              line: 2,
            },
          ],
        },
      ],
    });
    const legacyEvent = { ...currentEvent, schema_version: "1.0", event_id: "legacy-event" };
    const auditDir = join(repoRoot, ".aios", "audit");

    try {
      mkdirSync(auditDir, { recursive: true });
      writeFileSync(join(auditDir, "gate-events.jsonl"), `${JSON.stringify(legacyEvent)}\n`, "utf8");

      appendAuditEvents(repoRoot, [currentEvent]);

      const jsonl = readFileSync(join(auditDir, "gate-events.jsonl"), "utf8");
      const summary = readFileSync(join(auditDir, "gate-summary.md"), "utf8");

      assert.equal(jsonl.trim().split("\n").length, 2);
      assert.doesNotMatch(summary, /Seen: 2 times/);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

describe("formatAuditResults", () => {
  it("writes audit artifacts for blocking Anti-Slop results", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-audit-format-"));
    const priorGateMode = process.env.AIOS_QUALITY_GATE_MODE;

    try {
      process.env.AIOS_QUALITY_GATE_MODE = "block";
      const output = formatAuditResults(
        [
          {
            filePath: join(repoRoot, "app", "page.tsx"),
            messages: [
              {
                ruleId: "anti-slop/no-placeholder-copy",
                severity: 2,
                message: "Placeholder copy detected.",
                line: 2,
              },
            ],
          },
        ],
        { cwd: repoRoot },
      );

      assert.match(output, /Anti-Slop audit events: 1/);
      const eventText = readFileSync(join(repoRoot, ".aios", "audit", "gate-events.jsonl"), "utf8");
      const event = JSON.parse(eventText);
      assert.equal(event.schema_version, "1.1");
      assert.equal(event.gate, "Anti-Slop");
      assert.equal(event.event_type, "commit_blocked");
      assert.equal(event.rule_id, "anti-slop/no-placeholder-copy");
      assert.deepEqual(Object.keys(event.evidence[0]).sort(), ["file", "line_end", "line_start", "reason"]);
    } finally {
      if (priorGateMode === undefined) {
        delete process.env.AIOS_QUALITY_GATE_MODE;
      } else {
        process.env.AIOS_QUALITY_GATE_MODE = priorGateMode;
      }
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("replaces stale audit artifacts with an explicit analysis failure", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-audit-fatal-"));
    const auditDir = join(repoRoot, ".aios", "audit");

    try {
      mkdirSync(auditDir, { recursive: true });
      writeFileSync(join(auditDir, "gate-events.jsonl"), '{"stale":true}\n', "utf8");
      writeFileSync(join(auditDir, "gate-summary.md"), "stale\n", "utf8");
      writeFileSync(join(auditDir, "learning-lessons.md"), "stale\n", "utf8");

      const output = formatAuditResults(
        [
          {
            filePath: join(repoRoot, "app", "page.tsx"),
            fatalErrorCount: 1,
            messages: [
              {
                ruleId: null,
                fatal: true,
                severity: 2,
                message: "Parsing error: Unexpected token",
                line: 2,
                column: 4,
              },
            ],
          },
        ],
        { cwd: repoRoot },
      );

      const event = JSON.parse(readFileSync(join(auditDir, "gate-events.jsonl"), "utf8"));
      const summary = readFileSync(join(auditDir, "gate-summary.md"), "utf8");
      const lessons = readFileSync(join(auditDir, "learning-lessons.md"), "utf8");

      assert.match(output, /audit analysis failed/i);
      assert.equal(event.schema_version, "1.1");
      assert.equal(event.event_type, "analysis_failed");
      assert.equal(event.decision, "error");
      assert.equal(event.rule_id, null);
      assert.match(summary, /analysis failed/i);
      assert.match(lessons, /Parsing error/);
      assert.doesNotMatch(summary, /stale/);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
