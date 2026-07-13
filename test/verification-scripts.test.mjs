import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const coverageScript = join(repoRoot, "scripts", "check-coverage.mjs");
const dependencySecurityScript = join(repoRoot, "scripts", "dependency-security.mjs");
const releaseVersionScript = join(repoRoot, "scripts", "assert-release-version.mjs");
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const smokeConsumerPackageJson = JSON.parse(readFileSync(join(repoRoot, "smoke-consumer", "package.json"), "utf8"));

function runNode(script, { args = [], cwd = repoRoot, env = process.env } = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    env,
  });
}

function writeCoverageFixture({ threshold, lcov }) {
  const root = mkdtempSync(join(tmpdir(), "anti-slop-coverage-"));
  mkdirSync(join(root, "coverage"));
  writeFileSync(
    join(root, ".pre-cr.json"),
    JSON.stringify({ coveragePaths: ["coverage/lcov.info"], threshold }, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(join(root, "coverage", "lcov.info"), lcov, "utf8");
  return root;
}

describe("verification scripts", () => {
  it("enforces the configured coverage threshold", () => {
    const root = writeCoverageFixture({
      threshold: 50,
      lcov: "TN:\nSF:src/example.mjs\nDA:1,1\nDA:2,0\nend_of_record\n",
    });

    try {
      const result = runNode(coverageScript, { cwd: root });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Line coverage 50\.00% meets the 50% threshold/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails coverage below the configured threshold", () => {
    const root = writeCoverageFixture({
      threshold: 80,
      lcov: "TN:\nSF:src/example.mjs\nDA:1,1\nDA:2,0\nend_of_record\n",
    });

    try {
      const result = runNode(coverageScript, { cwd: root });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Line coverage 50\.00% is below the 80% threshold/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps an unavailable dependency audit advisory by default and strict on request", () => {
    const env = { ...process.env, PATH: "" };
    const advisory = runNode(dependencySecurityScript, { env });
    const required = runNode(dependencySecurityScript, { args: ["--require-registry"], env });

    assert.equal(advisory.status, 0);
    assert.match(advisory.stderr, /SKIPPED/);
    assert.equal(required.status, 1);
    assert.match(required.stderr, /REQUIRED/);
  });

  it("requires the release tag to match package.json", () => {
    const matching = runNode(releaseVersionScript, {
      env: { ...process.env, GITHUB_REF_NAME: `v${packageJson.version}` },
    });
    const mismatched = runNode(releaseVersionScript, {
      env: { ...process.env, GITHUB_REF_NAME: "v99.0.0" },
    });

    assert.equal(matching.status, 0, matching.stderr);
    assert.match(matching.stdout, /matches package version/);
    assert.equal(mismatched.status, 1);
    assert.match(mismatched.stderr, /does not match package version/);
  });

  it("keeps deterministic verification separate from registry-dependent checks", () => {
    assert.doesNotMatch(packageJson.scripts.verify, /verify:consumer-online|smoke:published/);
    assert.match(packageJson.scripts["verify:ci"], /pnpm verify:consumer-online/);
    assert.match(packageJson.scripts["verify:ci"], /pnpm dependency:security:required/);
  });

  it("links the local smoke consumer to the current checkout", () => {
    assert.equal(smokeConsumerPackageJson.dependencies["eslint-plugin-anti-slop"], "link:..");
    assert.match(packageJson.scripts["smoke:eslint9"], /pnpm --dir smoke-consumer install --frozen-lockfile/);
    assert.doesNotMatch(packageJson.scripts["smoke:eslint9"], /--force/);
  });
});
