import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const config = JSON.parse(readFileSync(join(root, ".pre-cr.json"), "utf8"));
const coveragePath = config.coveragePaths
  .map((path) => join(root, path))
  .find((path) => existsSync(path));

if (!coveragePath) {
  console.error("No configured coverage report was found.");
  process.exit(1);
}

let coveredLines = 0;
let totalLines = 0;
let sourceFile = false;
const sourceRoot = `${root.replaceAll("\\", "/")}/src/`;
for (const line of readFileSync(coveragePath, "utf8").split(/\r?\n/)) {
  if (line.startsWith("SF:")) {
    const reportedPath = line.slice(3).replaceAll("\\", "/");
    sourceFile = reportedPath.startsWith("src/") || reportedPath.startsWith(sourceRoot);
    continue;
  }

  if (!sourceFile || !line.startsWith("DA:")) {
    continue;
  }

  totalLines += 1;
  if (Number(line.slice(line.lastIndexOf(",") + 1)) > 0) {
    coveredLines += 1;
  }
}

if (totalLines === 0) {
  console.error(`No source line coverage records were found in ${coveragePath}.`);
  process.exit(1);
}

const coverage = (coveredLines / totalLines) * 100;
const threshold = config.threshold;
if (coverage < threshold) {
  console.error(`Line coverage ${coverage.toFixed(2)}% is below the ${threshold}% threshold.`);
  process.exit(1);
}

console.log(`Line coverage ${coverage.toFixed(2)}% meets the ${threshold}% threshold.`);
