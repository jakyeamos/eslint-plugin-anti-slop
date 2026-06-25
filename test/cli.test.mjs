import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCli } from "../src/cli.mjs";

const eslintResults = [
  {
    filePath: "/repo/app/page.tsx",
    messages: [
      {
        ruleId: "anti-slop/no-placeholder-copy",
        severity: 2,
        message: "Placeholder copy detected.",
        line: 2,
        column: 5,
      },
    ],
  },
];

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
    read() {
      return { stdout, stderr };
    },
  };
}

describe("runCli", () => {
  it("runs the check command and exits nonzero when block mode has new errors", async () => {
    const io = capture();
    const seen = {};

    const exitCode = await runCli(["check", "--format", "json", "--mode", "block"], {
      cwd: "/repo",
      stdout: io.stdout,
      stderr: io.stderr,
      eslintRunner: async (files) => {
        seen.files = files;
        return eslintResults;
      },
    });

    const output = JSON.parse(io.read().stdout);
    assert.equal(exitCode, 1);
    assert.equal(output.decision, "block");
    assert.deepEqual(seen.files, ["."]);
  });

  it("writes a baseline and returns zero when update-baseline is requested", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-baseline-"));
    const io = capture();

    try {
      const exitCode = await runCli(["check", "--update-baseline", "--baseline", ".anti-slop-baseline.json"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => [
          {
            ...eslintResults[0],
            filePath: join(repoRoot, "app", "page.tsx"),
          },
        ],
      });

      const baseline = JSON.parse(readFileSync(join(repoRoot, ".anti-slop-baseline.json"), "utf8"));
      assert.equal(exitCode, 0);
      assert.equal(baseline.findings.length, 1);
      assert.match(io.read().stdout, /Updated Anti-Slop baseline/);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("uses changed files when changed mode is requested", async () => {
    const io = capture();
    const seen = {};

    const exitCode = await runCli(["gate", "--changed", "--mode", "warn", "--format", "pre-cr"], {
      cwd: "/repo",
      stdout: io.stdout,
      stderr: io.stderr,
      changedFiles: () => ["app/page.tsx", "README.md"],
      eslintRunner: async (files) => {
        seen.files = files;
        return eslintResults;
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(seen.files, ["app/page.tsx", "README.md"]);
    assert.match(io.read().stdout, /"gate":"Anti-Slop"/);
  });

  it("filters configured ignored files from explicit file lists", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-ignore-"));
    const io = capture();
    const seen = {};

    try {
      writeFileSync(
        join(repoRoot, "anti-slop.config.json"),
        JSON.stringify({ ignores: ["dist/**"] }),
        "utf8",
      );

      await runCli(["check", "--files", "src/app.ts,dist/app.js"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async (files) => {
          seen.files = files;
          return [];
        },
      });

      assert.deepEqual(seen.files, ["src/app.ts"]);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("prints help for unknown commands", async () => {
    const io = capture();

    const exitCode = await runCli(["unknown"], {
      cwd: "/repo",
      stdout: io.stdout,
      stderr: io.stderr,
      eslintRunner: async () => [],
    });

    assert.equal(exitCode, 2);
    assert.match(io.read().stderr, /Usage: anti-slop/);
  });
});
