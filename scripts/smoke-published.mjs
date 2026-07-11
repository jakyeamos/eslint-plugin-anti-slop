import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const workRoot = mkdtempSync(join(tmpdir(), "anti-slop-published-smoke-"));

try {
  const packDir = join(workRoot, "pack");
  const fixtureRoot = join(workRoot, "fixture");

  execFileSync("pnpm", ["pack", "--pack-destination", packDir], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  const tarball = readdirSync(packDir).find((file) => file.endsWith(".tgz"));
  assert.ok(tarball, "pnpm pack should create a package tarball");
  const tarballPath = join(packDir, tarball);

  mkdirSync(fixtureRoot);
  writeFileSync(
    join(fixtureRoot, "package.json"),
    JSON.stringify(
      {
        name: "anti-slop-published-smoke-fixture",
        private: true,
        type: "module",
        dependencies: {
          "eslint-plugin-anti-slop": `file:${tarballPath}`,
        },
        devDependencies: {
          eslint: "^9.29.0",
          typescript: packageJson.devDependencies.typescript,
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  writeFileSync(
    join(fixtureRoot, "fixture.jsx"),
    [
      "export function BillingEmptyState() {",
      "  return (",
      "    <section>",
      "      <h2>Failed payments</h2>",
      "      <p>TODO</p>",
      "      <button>Create invoice</button>",
      "    </section>",
      "  );",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(fixtureRoot, "eslint.config.mjs"),
    [
      'import antiSlopAiosAuditConfig from "eslint-plugin-anti-slop/aios-audit-config";',
      "",
      "export default antiSlopAiosAuditConfig;",
      "",
    ].join("\n"),
    "utf8",
  );
  for (const fixtureFile of ["consumer.mts", "tsconfig.json"]) {
    copyFileSync(join(repoRoot, "test", "types", fixtureFile), join(fixtureRoot, fixtureFile));
  }
  writeFileSync(
    join(fixtureRoot, "verify-entrypoints.mjs"),
    [
      'import assert from "node:assert/strict";',
      'import antiSlop from "eslint-plugin-anti-slop";',
      'import { auditEventsFromEslintResults } from "eslint-plugin-anti-slop/audit";',
      'import { antiSlopFindingsFromResults, buildGateReport } from "eslint-plugin-anti-slop/gate";',
      'import antiSlopAiosAuditConfig, { antiSlopAuditFormatter, aiosAuditArtifacts } from "eslint-plugin-anti-slop/aios-audit-config";',
      'import formatAuditResults from "eslint-plugin-anti-slop/audit-formatter";',
      'import formatAuditResultsByExtension from "eslint-plugin-anti-slop/audit-formatter.mjs";',
      'import { runCli } from "eslint-plugin-anti-slop/cli";',
      'import { metadataForRule, ruleMetadata } from "eslint-plugin-anti-slop/rule-metadata";',
      "",
      'assert.equal(antiSlop.meta.name, "eslint-plugin-anti-slop");',
      "assert.ok(Array.isArray(antiSlopAiosAuditConfig));",
      'assert.equal(antiSlopAuditFormatter, "./node_modules/eslint-plugin-anti-slop/audit-formatter.mjs");',
      'assert.ok(aiosAuditArtifacts.includes(".aios/audit/gate-events.jsonl"));',
      'assert.equal(typeof formatAuditResults, "function");',
      "assert.equal(formatAuditResults, formatAuditResultsByExtension);",
      'assert.equal(typeof runCli, "function");',
      'assert.equal(typeof metadataForRule, "function");',
      'assert.equal(ruleMetadata["anti-slop/no-placeholder-copy"].category, "UX");',
      "",
      "const results = [",
      "  {",
      '    filePath: new URL("./fixture.jsx", import.meta.url).pathname,',
      "    messages: [",
      "      {",
      '        ruleId: "anti-slop/no-placeholder-copy",',
      "        severity: 2,",
      '        message: "Placeholder copy detected.",',
      "        line: 5,",
      "        column: 10,",
      "      },",
      "    ],",
      "  },",
      "];",
      "",
      "const findings = antiSlopFindingsFromResults({ repoRoot: process.cwd(), results });",
      'assert.equal(findings[0].ruleId, "anti-slop/no-placeholder-copy");',
      "const report = buildGateReport({ findings, mode: \"block\", branch: \"main\", repoRoot: process.cwd() });",
      'assert.equal(report.decision, "block");',
      "const events = auditEventsFromEslintResults({ repoRoot: process.cwd(), results, branch: \"main\" });",
      'assert.equal(events[0].gate, "Anti-Slop");',
      'assert.equal(events[0].decision, "block");',
      "",
    ].join("\n"),
    "utf8",
  );

  execFileSync("pnpm", ["install", "--frozen-lockfile=false"], {
    cwd: fixtureRoot,
    stdio: "inherit",
  });

  const cliOutput = execFileSync(
    "pnpm",
    ["exec", "anti-slop", "check", "fixture.jsx", "--mode", "audit", "--format", "json"],
    {
      cwd: fixtureRoot,
      encoding: "utf8",
    },
  );
  const cliReport = JSON.parse(cliOutput);
  assert.equal(cliReport.gate, "Anti-Slop");
  assert.ok(cliReport.newFindings.some((finding) => finding.ruleId === "anti-slop/no-placeholder-copy"));

  execFileSync("node", ["verify-entrypoints.mjs"], {
    cwd: fixtureRoot,
    stdio: "inherit",
  });

  execFileSync("pnpm", ["exec", "tsc", "--project", "tsconfig.json"], {
    cwd: fixtureRoot,
    stdio: "inherit",
  });

  try {
    execFileSync(
      "pnpm",
      ["exec", "eslint", "fixture.jsx", "--format", "./node_modules/eslint-plugin-anti-slop/audit-formatter.mjs"],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.fail("ESLint should exit nonzero when the audit formatter sees anti-slop findings");
  } catch (error) {
    assert.equal(error.status, 1);
  }

  const auditEvents = readFileSync(join(fixtureRoot, ".aios", "audit", "gate-events.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.ok(auditEvents.some((event) => event.rule_id === "anti-slop/no-placeholder-copy"));
} finally {
  rmSync(workRoot, { recursive: true, force: true });
}
