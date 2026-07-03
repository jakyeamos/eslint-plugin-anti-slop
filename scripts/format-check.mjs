import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([
  ".aios",
  ".git",
  ".quality-runner",
  "coverage",
  "node_modules",
  "smoke-consumer/node_modules",
]);
const ignoredFiles = new Set(["pnpm-lock.yaml", "smoke-consumer/pnpm-lock.yaml"]);
const textExtensions = new Set([".js", ".json", ".jsx", ".md", ".mjs", ".yml", ".yaml"]);

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

    if (stat.isFile() && textExtensions.has(extname(entry)) && !ignoredFiles.has(rel)) {
      files.push(path);
    }
  }
}

const files = [];
collectFiles(root, files);

const failures = [];
for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, "utf8");

  if (!text.endsWith("\n")) {
    failures.push(`${rel}: missing final newline`);
  }

  const trailingWhitespaceLine = text.split("\n").findIndex((line) => /[ \t]+$/.test(line));
  if (trailingWhitespaceLine !== -1) {
    failures.push(`${rel}:${trailingWhitespaceLine + 1}: trailing whitespace`);
  }

  if (extname(file) === ".json") {
    const expected = `${JSON.stringify(JSON.parse(text), null, 2)}\n`;
    if (text !== expected) {
      failures.push(`${rel}: JSON is not formatted with two-space indentation`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked formatting hygiene for ${files.length} files.`);
