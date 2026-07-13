import { execFileSync } from "node:child_process";

const PROTECTED_BRANCHES = new Set(["main", "master", "dev", "develop", "development"]);
const BRANCH_ENV_KEYS = ["AIOS_BRANCH", "GITHUB_REF_NAME", "GITHUB_HEAD_REF", "BRANCH_NAME", "VERCEL_GIT_COMMIT_REF"];
const DEV_ENV_KEYS = ["AIOS_DEV_ENVIRONMENT", "AIOS_DEV_ENV", "QUALITY_GATE_DEV_ENV", "GATE_CONNECTED_DEV_ENV"];

export function qualityGateDecision(branch) {
  const mode = firstEnv(["AIOS_QUALITY_GATE_MODE", "QUALITY_GATE_MODE"])?.toLowerCase();
  if (["warn", "warning", "soft"].includes(mode)) {
    return "warn";
  }
  if (["block", "blocking", "hard"].includes(mode)) {
    return "block";
  }
  if (branch && PROTECTED_BRANCHES.has(normalizeBranch(branch))) {
    return "block";
  }
  if (DEV_ENV_KEYS.some((key) => truthy(process.env[key]))) {
    return "block";
  }
  if (["production", "development"].includes(process.env.VERCEL_ENV?.trim().toLowerCase() ?? "")) {
    return "block";
  }
  return branch ? "warn" : "block";
}

export function currentBranch(repoRoot) {
  const envBranch = firstEnv(BRANCH_ENV_KEYS);
  if (envBranch) {
    return normalizeBranch(envBranch);
  }
  try {
    return normalizeBranch(execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim());
  } catch {
    return null;
  }
}

function firstEnv(keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}

function normalizeBranch(branch) {
  return branch.replace(/^refs\/heads\//, "").replace(/^origin\//, "");
}

function truthy(value) {
  return ["1", "true", "yes", "on", "block"].includes(value?.trim().toLowerCase() ?? "");
}
