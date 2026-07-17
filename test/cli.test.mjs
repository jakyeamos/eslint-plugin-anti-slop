import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCli } from "../src/cli.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

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

const fatalEslintResults = [
  {
    filePath: "/repo/app/page.tsx",
    fatalErrorCount: 1,
    messages: [
      {
        ruleId: null,
        fatal: true,
        severity: 2,
        message: "Parsing error: Unexpected token",
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

function isolatedGitEnv() {
  const env = { ...process.env };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR"]) {
    delete env[key];
  }
  return env;
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

  it("selects the evidence preset for the QR adapter", async () => {
    const io = capture();
    const seen = {};

    const exitCode = await runCli(["check", "--preset", "evidence", "--format", "json", "--mode", "audit"], {
      cwd: "/repo",
      stdout: io.stdout,
      stderr: io.stderr,
      eslintRunner: async (_files, options) => {
        seen.options = options;
        return [];
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(seen.options, { cwd: "/repo", ignores: [] });
    assert.equal(JSON.parse(io.read().stdout).analysis.status, "complete");
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
      const gitEnv = isolatedGitEnv();
      execFileSync("git", ["init", "--initial-branch", "feature/glob-cli"], {
        cwd: repoRoot,
        stdio: "ignore",
        env: gitEnv,
      });
      execFileSync(
        "git",
        ["-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "--allow-empty", "-m", "init"],
        { cwd: repoRoot, stdio: "ignore", env: gitEnv },
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

  it("prints root and subcommand help successfully without loading project inputs", async () => {
    for (const argv of [["--help"], ["check", "--help"], ["gate", "-h"]]) {
      const io = capture();
      let runnerCalled = false;

      const exitCode = await runCli(argv, {
        cwd: "/repo",
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => {
          runnerCalled = true;
          return [];
        },
      });

      assert.equal(exitCode, 0, argv.join(" "));
      assert.match(io.read().stdout, /Usage: anti-slop/);
      assert.match(io.read().stdout, /--version/);
      assert.equal(io.read().stderr, "");
      assert.equal(runnerCalled, false);
    }
  });

  it("prints the installed package version for the root version flag", async () => {
    for (const argv of [["--version"], ["-v"]]) {
      const io = capture();
      let runnerCalled = false;

      const exitCode = await runCli(argv, {
        cwd: "/repo",
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => {
          runnerCalled = true;
          return [];
        },
      });

      assert.equal(exitCode, 0, argv.join(" "));
      assert.equal(io.read().stdout, `anti-slop ${packageJson.version}\n`);
      assert.equal(io.read().stderr, "");
      assert.equal(runnerCalled, false);
    }
  });

  it("rejects malformed configuration before running ESLint", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-invalid-config-"));
    const io = capture();
    let runnerCalled = false;

    try {
      writeFileSync(join(repoRoot, "anti-slop.config.json"), JSON.stringify({ mode: "not-a-mode" }), "utf8");

      const exitCode = await runCli(["check", "--mode", "audit"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => {
          runnerCalled = true;
          return [];
        },
      });

      assert.equal(exitCode, 2);
      assert.equal(io.read().stdout, "");
      assert.match(io.read().stderr, /Anti-Slop configuration error/);
      assert.match(io.read().stderr, /mode/);
      assert.equal(runnerCalled, false);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects report output outside the project before analysis or writes", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-output-path-"));
    const outsideReportPath = `${repoRoot}.report.json`;
    const io = capture();
    let runnerCalled = false;

    try {
      writeFileSync(
        join(repoRoot, "anti-slop.config.json"),
        JSON.stringify({ outputPath: outsideReportPath }),
        "utf8",
      );

      const exitCode = await runCli(["check"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => {
          runnerCalled = true;
          return [];
        },
      });

      assert.equal(exitCode, 2);
      assert.equal(io.read().stdout, "");
      assert.match(io.read().stderr, /Anti-Slop configuration error/);
      assert.match(io.read().stderr, /outputPath/);
      assert.equal(runnerCalled, false);
      assert.equal(existsSync(outsideReportPath), false);
    } finally {
      rmSync(outsideReportPath, { force: true });
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects report output through a symlink before analysis or writes", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-output-symlink-"));
    const outsideRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-output-outside-"));
    const outsideReportPath = join(outsideRoot, "report.json");
    const io = capture();
    let runnerCalled = false;

    try {
      symlinkSync(outsideRoot, join(repoRoot, "reports"), "dir");
      writeFileSync(
        join(repoRoot, "anti-slop.config.json"),
        JSON.stringify({ outputPath: "reports/report.json" }),
        "utf8",
      );

      const exitCode = await runCli(["check"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => {
          runnerCalled = true;
          return [];
        },
      });

      assert.equal(exitCode, 2);
      assert.equal(io.read().stdout, "");
      assert.match(io.read().stderr, /Anti-Slop configuration error/);
      assert.match(io.read().stderr, /outputPath/);
      assert.equal(runnerCalled, false);
      assert.equal(existsSync(outsideReportPath), false);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
      rmSync(outsideRoot, { recursive: true, force: true });
    }
  });

  it("rejects malformed baselines before analysis and never overwrites them", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-invalid-baseline-"));
    const baselinePath = join(repoRoot, ".anti-slop-baseline.json");
    const io = capture();
    let runnerCalled = false;

    try {
      writeFileSync(baselinePath, JSON.stringify({ schemaVersion: "1.0", findings: [] }), "utf8");

      const exitCode = await runCli(["check", "--mode", "audit", "--update-baseline"], {
        cwd: repoRoot,
        stdout: io.stdout,
        stderr: io.stderr,
        eslintRunner: async () => {
          runnerCalled = true;
          return eslintResults;
        },
      });

      assert.equal(exitCode, 2);
      assert.equal(io.read().stdout, "");
      assert.match(io.read().stderr, /Anti-Slop baseline error/);
      assert.equal(runnerCalled, false);
      assert.deepEqual(JSON.parse(readFileSync(baselinePath, "utf8")), { schemaVersion: "1.0", findings: [] });
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("accepts legacy and current baseline envelopes", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-baseline-compat-"));
    const baselinePath = join(repoRoot, ".anti-slop-baseline.json");

    try {
      const seedIo = capture();
      await runCli(["check", "--update-baseline"], {
        cwd: repoRoot,
        stdout: seedIo.stdout,
        stderr: seedIo.stderr,
        eslintRunner: async () => eslintResults.map((result) => ({
          ...result,
          filePath: join(repoRoot, "app", "page.tsx"),
        })),
      });
      const fingerprint = JSON.parse(readFileSync(baselinePath, "utf8")).findings[0].fingerprint;
      const baselineShapes = [
        [fingerprint],
        { findings: [fingerprint, { fingerprint, ruleId: "anti-slop/no-placeholder-copy" }] },
        { schemaVersion: "1.0", gate: "Anti-Slop", findings: [{ fingerprint }] },
      ];

      for (const baseline of baselineShapes) {
        const io = capture();
        writeFileSync(baselinePath, JSON.stringify(baseline), "utf8");
        const exitCode = await runCli(["gate", "--mode", "block", "--format", "json"], {
          cwd: repoRoot,
          stdout: io.stdout,
          stderr: io.stderr,
          eslintRunner: async () => eslintResults.map((result) => ({
            ...result,
            filePath: join(repoRoot, "app", "page.tsx"),
          })),
        });
        const report = JSON.parse(io.read().stdout);

        assert.equal(exitCode, 0);
        assert.equal(report.decision, "pass");
        assert.equal(report.baselinedFindings.length, 1);
      }
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("reports fatal analysis failures and refuses baseline writes in every mode", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "anti-slop-cli-fatal-"));

    try {
      for (const mode of ["block", "warn", "audit"]) {
        const io = capture();
        const baselinePath = `.anti-slop-${mode}-baseline.json`;
        const exitCode = await runCli([
          "check",
          "--mode",
          mode,
          "--format",
          "json",
          "--update-baseline",
          "--baseline",
          baselinePath,
        ], {
          cwd: repoRoot,
          stdout: io.stdout,
          stderr: io.stderr,
          eslintRunner: async () => fatalEslintResults.map((result) => ({
            ...result,
            filePath: join(repoRoot, "app", "page.tsx"),
          })),
        });
        const report = JSON.parse(io.read().stdout);

        assert.equal(exitCode, 1, mode);
        assert.equal(report.mode, mode);
        assert.equal(report.decision, "error");
        assert.equal(report.analysis.status, "failed");
        assert.equal(report.analysis.errors[0].kind, "parser");
        assert.match(io.read().stderr, /analysis failed/i);
        assert.equal(existsSync(join(repoRoot, baselinePath)), false);
      }
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("reports runner failures as failed analysis", async () => {
    const io = capture();

    const exitCode = await runCli(["check", "--format", "json"], {
      cwd: "/repo",
      stdout: io.stdout,
      stderr: io.stderr,
      eslintRunner: async () => {
        throw new Error("ESLint service unavailable");
      },
    });
    const report = JSON.parse(io.read().stdout);

    assert.equal(exitCode, 1);
    assert.equal(report.decision, "error");
    assert.equal(report.analysis.status, "failed");
    assert.match(report.analysis.errors[0].message, /ESLint service unavailable/);
  });

  it("treats an empty changed set as a skipped no-op instead of a full scan", async () => {
    const io = capture();
    let runnerCalled = false;

    const exitCode = await runCli(["gate", "--changed", "--format", "json"], {
      cwd: "/repo",
      stdout: io.stdout,
      stderr: io.stderr,
      changedFiles: () => [],
      eslintRunner: async () => {
        runnerCalled = true;
        return eslintResults;
      },
    });
    const report = JSON.parse(io.read().stdout);

    assert.equal(exitCode, 0);
    assert.equal(report.decision, "skipped");
    assert.equal(report.analysis.status, "skipped");
    assert.equal(report.analysis.selection, "changed");
    assert.deepEqual(report.analysis.files, []);
    assert.equal(runnerCalled, false);

    const sarifIo = capture();
    const sarifExitCode = await runCli(["gate", "--changed", "--format", "sarif"], {
      cwd: "/repo",
      stdout: sarifIo.stdout,
      stderr: sarifIo.stderr,
      changedFiles: () => [],
      eslintRunner: async () => {
        runnerCalled = true;
        return eslintResults;
      },
    });
    const sarif = JSON.parse(sarifIo.read().stdout);

    assert.equal(sarifExitCode, 0);
    assert.equal(sarif.runs[0].results[0].ruleId, "anti-slop/analysis-skipped");
    assert.equal(runnerCalled, false);
  });

  it("treats changed-file discovery failures as input errors", async () => {
    const io = capture();
    let runnerCalled = false;

    const exitCode = await runCli(["gate", "--changed"], {
      cwd: "/repo",
      stdout: io.stdout,
      stderr: io.stderr,
      changedFiles: () => {
        throw new Error("git diff failed");
      },
      eslintRunner: async () => {
        runnerCalled = true;
        return [];
      },
    });

    assert.equal(exitCode, 2);
    assert.equal(io.read().stdout, "");
    assert.match(io.read().stderr, /Unable to determine changed files/);
    assert.equal(runnerCalled, false);
  });
});
