import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKETS = [
  "architecture.md",
  "commands.md",
  "conventions.md",
  "security.md",
  "failure-modes.md",
  "examples.md",
  "done.md",
  "deployment.md",
];
const REQUIRED_FILES = [
  "AGENTS.md",
  "README.md",
  "SECURITY.md",
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  ".pre-cr.json",
  ".quality-runner.toml",
  ".github/workflows/ci.yml",
];
const REQUIRED_IGNORES = [
  ".env",
  ".env.*",
  "!.env.example",
  ".pre-cr/",
  ".quality-runner/",
  "node_modules/",
  "coverage/",
  ".aios/audit/",
];
const REVIEW_RE = /last_reviewed:\s*(\d{4}-\d{2}-\d{2})/;
const LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const SECRET_RE = /(^|\/)(?:\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|id_rsa|credentials(?:\.[^/]+)?)$/i;
const SAFE_SECRET_NAMES = new Set([".env.example", ".env.template"]);

function readText(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  const value = JSON.parse(readText(path));
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must contain an object`);
  }
  return value;
}

function fileExists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function contextChecks(errors, asOf, root) {
  const indexPath = join(root, ".agents", "context", "README.md");
  if (!fileExists(indexPath)) {
    errors.push("context index is missing");
    return 0;
  }
  const text = readText(indexPath);
  const reviewed = text.match(REVIEW_RE)?.[1];
  if (!reviewed) {
    errors.push("context index is missing last_reviewed");
  } else {
    const age = (asOf - new Date(`${reviewed}T00:00:00Z`)) / 86_400_000;
    if (!Number.isFinite(age) || age < 0) errors.push("context freshness date is invalid or future-dated");
    if (age > 35) errors.push(`context index is stale: ${reviewed}`);
  }
  for (const match of text.matchAll(LINK_RE)) {
    const link = match[1].split("#", 1)[0].trim();
    if (!link || /^[a-z][a-z0-9+.-]*:/i.test(link)) continue;
    const target = resolve(dirname(indexPath), link);
    const outside = relative(root, target).startsWith("..");
    if (outside || !fileExists(target)) errors.push(`broken context link: ${link}`);
  }
  let present = 0;
  for (const packet of PACKETS) {
    const path = join(root, ".agents", "context", packet);
    if (!fileExists(path)) errors.push(`missing context packet: ${packet}`);
    else present += 1;
  }
  return present;
}

function packageChecks(errors, root) {
  const pkg = readJson(join(root, "package.json"));
  if (pkg.packageManager !== "pnpm@10.34.5") errors.push("packageManager must be pnpm@10.34.5");
  for (const script of ["lint", "typecheck", "test", "build", "coverage", "quality:contract", "dependency:security"]) {
    if (typeof pkg.scripts?.[script] !== "string") errors.push(`missing package script: ${script}`);
  }
  if (pkg.engines?.node !== "^22.13.0 || >=24") errors.push("package engines must keep the supported Node range");
  const typecheck = pkg.scripts?.typecheck ?? "";
  if (!typecheck.includes("tsc -p test/types/tsconfig.json")) errors.push("typecheck must run the strict consumer TypeScript contract");
  const tsconfig = readJson(join(root, "test/types/tsconfig.json"));
  if (tsconfig.compilerOptions?.strict !== true) errors.push("test/types/tsconfig.json must keep strict=true");
  if (tsconfig.compilerOptions?.noEmit !== true) errors.push("test/types/tsconfig.json must keep noEmit=true");
  return tsconfig.compilerOptions?.strict === true;
}

function dependencyChecks(errors, root) {
  const text = readText(join(root, "pnpm-workspace.yaml"));
  for (const override of [
    "eslint>minimatch: 10.2.5",
    "'@eslint/config-array>minimatch': 10.2.5",
    "'@eslint/eslintrc>minimatch': 10.2.5",
    "js-yaml: 4.3.0",
  ]) {
    if (!text.includes(override)) errors.push(`missing required dependency override: ${override}`);
  }
}

function preCrChecks(errors, root) {
  const config = readJson(join(root, ".pre-cr.json"));
  if (config.testCommand !== "pnpm test:coverage") errors.push(".pre-cr.json testCommand drift");
  if (config.coverageFormat !== "auto") errors.push(".pre-cr.json coverageFormat drift");
  if (!config.coveragePaths?.includes("coverage/lcov.info")) errors.push(".pre-cr.json must include coverage/lcov.info");
  const adapter = (config.qualityAdapters ?? []).find((item) => item?.name === "environment-contract");
  if (adapter?.command !== "node scripts/check_environment_contract.mjs" || adapter.required !== true) {
    errors.push("required environment-contract Pre-CR adapter is missing or drifted");
  }
}

function ciChecks(errors, root) {
  const text = readText(join(root, ".github", "workflows", "ci.yml"));
  for (const command of ["pnpm install --frozen-lockfile", "pnpm quality:contract", "pnpm verify:ci", "pnpm smoke:published:eslint9-floor"]) {
    if (!text.includes(command)) errors.push(`CI missing command: ${command}`);
  }
}

function qualityRunnerChecks(errors, root) {
  const text = readText(join(root, ".quality-runner.toml"));
  for (const gate of ["security_dependency_audit", "environment_contract"]) {
    if (!text.includes(`id = "${gate}"`)) errors.push(`missing Quality Runner gate: ${gate}`);
  }
  if (!text.includes('command = "node scripts/check_environment_contract.mjs"')) {
    errors.push("environment_contract Quality Runner command drift");
  }
  if (!text.includes('severity = "blocker"')) errors.push("Quality Runner gates must remain blocking");
}

function gitIgnoreChecks(errors, root) {
  const entries = new Set(readText(join(root, ".gitignore")).split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  for (const entry of REQUIRED_IGNORES) if (!entries.has(entry)) errors.push(`missing .gitignore rule: ${entry}`);
  if (!entries.has(".agents/*") || !entries.has("!.agents/context/") || !entries.has("!.agents/context/**")) {
    errors.push(".gitignore must keep tracked context packets visible");
  }
}

function secretChecks(errors, root) {
  let output;
  try {
    output = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" });
  } catch {
    errors.push("git tracked-path inspection unavailable");
    return null;
  }
  const paths = output.split("\0").filter(Boolean);
  const secrets = paths.filter((path) => !SAFE_SECRET_NAMES.has(path.split("/").at(-1)) && SECRET_RE.test(path));
  for (const path of secrets) errors.push(`secret-like tracked path: ${path}`);
  return secrets.length;
}

export function validateContract(root = ROOT, asOf = new Date()) {
  const errors = [];
  for (const file of REQUIRED_FILES) if (!fileExists(join(root, file))) errors.push(`missing required surface: ${file}`);
  const contextPackets = contextChecks(errors, asOf, root);
  const strictConsumerTypes = packageChecks(errors, root);
  dependencyChecks(errors, root);
  preCrChecks(errors, root);
  ciChecks(errors, root);
  qualityRunnerChecks(errors, root);
  gitIgnoreChecks(errors, root);
  const trackedSecretPaths = secretChecks(errors, root);
  const uniqueErrors = [...new Set(errors)].sort();
  return {
    schema_version: "environment-contract/v1",
    root,
    as_of: asOf.toISOString(),
    status: uniqueErrors.length === 0 ? "pass" : "fail",
    errors: uniqueErrors,
    checks: {
      context_packets: contextPackets,
      context_packets_required: PACKETS.length,
      strict_consumer_types: strictConsumerTypes,
      tracked_secret_paths: trackedSecretPaths,
      required_pre_cr_adapter: uniqueErrors.every((error) => !error.includes("Pre-CR adapter")),
    },
  };
}

const result = validateContract();
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === "pass" ? 0 : 1;
