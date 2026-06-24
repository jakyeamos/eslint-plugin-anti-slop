import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  appendAuditEvents,
  auditEventsFromEslintResults,
  dedupeFingerprint,
  redactSecrets,
} from "../src/audit.mjs";
import formatAuditResults from "../src/audit-formatter.mjs";

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
    assert.match(events[0].summary, /warning only/);
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
    const text = 'token = "ghp_1234567890abcdef" password: "correct-horse-battery"';

    const redacted = redactSecrets(text);

    assert.doesNotMatch(redacted, /ghp_1234567890abcdef/);
    assert.doesNotMatch(redacted, /correct-horse-battery/);
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
      results: [
        {
          filePath: join(repoRoot, "app", "page.tsx"),
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
});

describe("formatAuditResults", () => {
  it("writes audit artifacts for blocking Anti-Slop results", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-audit-format-"));

    try {
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
      assert.match(eventText, /anti-slop\/no-placeholder-copy/);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
