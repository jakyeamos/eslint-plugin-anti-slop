import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const expectedTag = `v${packageJson.version}`;
const releaseTag = process.env.GITHUB_REF_NAME;

if (!releaseTag) {
  console.error("GITHUB_REF_NAME must contain the release tag.");
  process.exit(1);
}

if (releaseTag !== expectedTag) {
  console.error(`Release tag ${releaseTag} does not match package version ${packageJson.version}.`);
  process.exit(1);
}

console.log(`Release tag ${releaseTag} matches package version ${packageJson.version}.`);
