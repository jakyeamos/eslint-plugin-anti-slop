import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const coverageScript = join(repoRoot, "scripts", "check-coverage.mjs");
const deadCodeScript = join(repoRoot, "scripts", "dead-code-check.mjs");
const dependencySecurityScript = join(repoRoot, "scripts", "dependency-security.mjs");
const releaseVersionScript = join(repoRoot, "scripts", "assert-release-version.mjs");
const secretScanScript = join(repoRoot, "scripts", "secret-scan.mjs");
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

function writeCircularImportFixture() {
  const root = mkdtempSync(join(tmpdir(), "anti-slop-import-cycle-"));
  const sourceRoot = join(root, "src");
  mkdirSync(sourceRoot);
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ exports: { ".": "./src/entry.mjs" } }, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(join(sourceRoot, "entry.mjs"), 'import "./first.mjs";\n', "utf8");
  writeFileSync(join(sourceRoot, "first.mjs"), 'import "./second.mjs";\n', "utf8");
  writeFileSync(join(sourceRoot, "second.mjs"), 'import "./first.mjs";\n', "utf8");
  return root;
}

function writeTrackedSecretFixture(files) {
  const root = mkdtempSync(join(tmpdir(), "anti-slop-secret-scan-"));

  for (const [relativePath, contents] of Object.entries(files)) {
    const path = join(root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents, "utf8");
  }

  const initialized = spawnSync("git", ["init", "--quiet"], { cwd: root, encoding: "utf8" });
  assert.equal(initialized.status, 0, initialized.stderr);
  const staged = spawnSync("git", ["add", "--force", "--all"], { cwd: root, encoding: "utf8" });
  assert.equal(staged.status, 0, staged.stderr);
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

  it("rejects circular local imports in the reachable module graph", () => {
    const root = writeCircularImportFixture();

    try {
      const result = runNode(deadCodeScript, { cwd: root });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Circular local imports/);
      assert.match(result.stderr, /src\/first\.mjs -> src\/second\.mjs -> src\/first\.mjs/);
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

  it("detects staged secrets across dotfiles, key files, and opaque extensions", () => {
    const apiKey = "a".repeat(24);
    const githubToken = `ghp_${"a".repeat(36)}`;
    const privateKeyHeader = ["-----BEGIN ", "PRIVATE KEY-----"].join("");
    const root = writeTrackedSecretFixture({
      ".env.production": `API_KEY=${apiKey}\n`,
      "certs/deploy.key": `${privateKeyHeader}\n`,
      "ops/release.opaque": `${githubToken}\n`,
    });

    try {
      const result = runNode(secretScanScript, { cwd: root });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /\.env\.production/);
      assert.match(result.stderr, /certs\/deploy\.key/);
      assert.match(result.stderr, /ops\/release\.opaque/);
      assert.doesNotMatch(result.stderr, new RegExp(apiKey));
      assert.doesNotMatch(result.stderr, new RegExp(githubToken));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("limits secret scanning to tracked project contents", () => {
    const root = writeTrackedSecretFixture({
      "src/safe.mjs": "export const safe = true;\n",
    });
    const apiKey = "a".repeat(24);

    try {
      writeFileSync(join(root, ".env.local"), `API_KEY=${apiKey}\n`, "utf8");
      const result = runNode(secretScanScript, { cwd: root });
      assert.equal(result.status, 0, result.stderr);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("detects staged secrets even when the working tree is later made safe", () => {
    const apiKey = "a".repeat(24);
    const root = writeTrackedSecretFixture({
      ".env": `API_KEY=${apiKey}\n`,
    });

    try {
      writeFileSync(join(root, ".env"), "API_KEY=redacted\n", "utf8");
      const result = runNode(secretScanScript, { cwd: root });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /\.env/);
      assert.doesNotMatch(result.stderr, new RegExp(apiKey));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("detects secrets in tracked working-tree files before they are staged", () => {
    const apiKey = "a".repeat(24);
    const root = writeTrackedSecretFixture({
      "src/settings.mjs": "export const apiKey = null;\n",
    });

    try {
      writeFileSync(join(root, "src", "settings.mjs"), `API_KEY=${apiKey}\n`, "utf8");
      const result = runNode(secretScanScript, { cwd: root });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /src\/settings\.mjs/);
      assert.doesNotMatch(result.stderr, new RegExp(apiKey));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not let padding hide a secret in a tracked text file", () => {
    const apiKey = "a".repeat(24);
    const root = writeTrackedSecretFixture({
      "notes/padded.txt": `${"x".repeat(1024 * 1024 + 1)}\nAPI_KEY=${apiKey}\n`,
    });

    try {
      const result = runNode(secretScanScript, { cwd: root });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /notes\/padded\.txt/);
      assert.match(result.stderr, /credential assignment/);
      assert.doesNotMatch(result.stderr, new RegExp(apiKey));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
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
