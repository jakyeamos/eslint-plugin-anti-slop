import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  it("runs with the built-in anti-slop config when a repo has no ESLint config", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-standalone-"));
    const io = capture();

    try {
      mkdirSync(join(repoRoot, "app"));
      writeFileSync(
        join(repoRoot, "app", "page.tsx"),
        "export function Page(): JSX.Element {\n  return <p>TODO</p>;\n}\n",
        "utf8",
      );

      const exitCode = await runCli(["check", "app/page.tsx", "--format", "json", "--mode", "audit"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
      });

      const output = JSON.parse(io.read().stdout);
      assert.equal(exitCode, 0);
      assert.equal(output.gate, "Anti-Slop");
      assert.equal(output.newFindings[0].ruleId, "anti-slop/no-placeholder-copy");
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

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

  it("applies glob ignore patterns beyond exact paths and trailing /**", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-glob-"));
    const io = capture();
    const seen = {};

    try {
      writeFileSync(
        join(repoRoot, "anti-slop.config.json"),
        JSON.stringify({ ignores: ["**/generated/**", "*.stories.tsx", "src/**/*.fixture.ts"] }),
        "utf8",
      );

      await runCli([
        "check",
        "--files",
        "src/app.ts,src/generated/api.ts,components/Button.stories.tsx,src/lib/user.fixture.ts",
      ], {
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

  it("detects the current git branch in auto mode when --branch is not passed", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-branch-"));
    const io = capture();

    const branchEnvKeys = [
      "AIOS_BRANCH",
      "GITHUB_REF_NAME",
      "GITHUB_HEAD_REF",
      "BRANCH_NAME",
      "VERCEL_GIT_COMMIT_REF",
      "AIOS_QUALITY_GATE_MODE",
      "QUALITY_GATE_MODE",
      "AIOS_DEV_ENVIRONMENT",
      "AIOS_DEV_ENV",
      "QUALITY_GATE_DEV_ENV",
      "GATE_CONNECTED_DEV_ENV",
      "VERCEL_ENV",
    ];
    const savedEnv = new Map(branchEnvKeys.map((key) => [key, process.env[key]]));

    try {
      for (const key of branchEnvKeys) {
        delete process.env[key];
      }
      execFileSync("git", ["init", "--initial-branch", "feature/glob-cli"], { cwd: repoRoot, stdio: "ignore" });
      execFileSync(
        "git",
        ["-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "--allow-empty", "-m", "init"],
        { cwd: repoRoot, stdio: "ignore" },
      );

      const exitCode = await runCli(["check", "--format", "json"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => eslintResults,
      });

      const output = JSON.parse(io.read().stdout);
      assert.equal(output.branch, "feature/glob-cli");
      assert.equal(output.effectiveMode, "warn");
      assert.equal(exitCode, 0);
    } finally {
      for (const [key, value] of savedEnv) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
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
