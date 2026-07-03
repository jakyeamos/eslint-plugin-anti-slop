import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";

const root = process.cwd();
const sourceDirs = ["src", "bin", "scripts", "test"];
const importPatterns = [
  /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["'](\.[^"']+)["']/g,
  /\bimport\(["'](\.[^"']+)["']\)/g,
];

function collectMjsFiles(dir, files) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      collectMjsFiles(path, files);
      continue;
    }

    if (stat.isFile() && [".js", ".mjs"].includes(extname(entry))) {
      files.add(path);
    }
  }
}

function resolveImport(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.mjs`,
    `${base}.js`,
    join(base, "index.mjs"),
    join(base, "index.js"),
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

function scriptFileReferences(command) {
  return [...command.matchAll(/(?:^|\s)(?:\.\/)?([A-Za-z0-9_./-]+\.(?:mjs|js))(?:\s|$)/g)]
    .map((match) => resolve(root, match[1]))
    .filter((path) => existsSync(path));
}

const allFiles = new Set();
for (const dir of sourceDirs) {
  const path = join(root, dir);
  if (existsSync(path)) {
    collectMjsFiles(path, allFiles);
  }
}
for (const entry of readdirSync(root)) {
  const path = join(root, entry);
  if (statSync(path).isFile() && extname(entry) === ".mjs") {
    allFiles.add(path);
  }
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const roots = new Set();

for (const target of Object.values(packageJson.exports ?? {})) {
  if (typeof target === "string") {
    roots.add(resolve(root, target));
  }
}
for (const target of Object.values(packageJson.bin ?? {})) {
  roots.add(resolve(root, target));
}
for (const command of Object.values(packageJson.scripts ?? {})) {
  for (const path of scriptFileReferences(command)) {
    roots.add(path);
  }
}
for (const file of allFiles) {
  if (relative(root, file).startsWith("test/") && file.endsWith(".test.mjs")) {
    roots.add(file);
  }
}

const reachable = new Set();
const queue = [...roots].filter((path) => allFiles.has(path));

while (queue.length > 0) {
  const file = queue.pop();
  if (reachable.has(file)) {
    continue;
  }

  reachable.add(file);
  const text = readFileSync(file, "utf8");
  for (const pattern of importPatterns) {
    for (const match of text.matchAll(pattern)) {
      const imported = resolveImport(file, match[1]);
      if (imported && allFiles.has(imported) && !reachable.has(imported)) {
        queue.push(imported);
      }
    }
  }
}

const unused = [...allFiles]
  .filter((file) => !reachable.has(file))
  .map((file) => normalize(relative(root, file)))
  .sort();

if (unused.length > 0) {
  console.error(`Unreachable JavaScript files:\n${unused.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

console.log(`Checked ${allFiles.size} JavaScript files for reachable entrypoints.`);
