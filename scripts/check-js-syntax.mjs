import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", ".quality-runner", "coverage", "node_modules", "smoke-consumer/node_modules"]);
const extensions = new Set([".js", ".mjs"]);

function collectFiles(dir, files) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(root, path);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (!ignoredDirs.has(entry) && !ignoredDirs.has(rel)) {
        collectFiles(path, files);
      }
      continue;
    }

    if (stat.isFile() && extensions.has(extname(entry))) {
      files.push(path);
    }
  }
}

const files = [];
collectFiles(root, files);

const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`${relative(root, file)}\n${result.stderr || result.stdout}`.trim());
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`Checked JavaScript syntax for ${files.length} files.`);
