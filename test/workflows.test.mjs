import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const actionPins = {
  "actions/checkout": {
    pin: "93cb6efe18208431cddfb8368fd83d5badbf9bfd",
    version: "v5.0.1",
  },
  "actions/setup-node": {
    pin: "a0853c24544627f65ddf259abe73b1d18a591444",
    version: "v5.0.0",
  },
  "pnpm/action-setup": {
    pin: "fc06bc1257f339d1d5d8b3a19a8cae5388b55320",
    version: "v4.4.0",
  },
};
const ciWorkflow = readFileSync(fileURLToPath(new URL("../.github/workflows/ci.yml", import.meta.url)), "utf8");
const publishWorkflow = readFileSync(fileURLToPath(new URL("../.github/workflows/publish.yml", import.meta.url)), "utf8");
const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));

function assertActionPins(workflow) {
  for (const [action, { pin, version }] of Object.entries(actionPins)) {
    assert.match(workflow, new RegExp(`uses: ${action}@${pin} # ${version}`));
  }
  assert.doesNotMatch(workflow, /uses: (?:actions\/checkout|actions\/setup-node|pnpm\/action-setup)@v4/);
}

describe("GitHub workflows", () => {
  it("runs the CI matrix with read-only permissions, cancellation, and immutable action pins", () => {
    assertActionPins(ciWorkflow);
    assert.match(ciWorkflow, /permissions:\n  contents: read/);
    assert.match(ciWorkflow, /group: ci-\$\{\{ github\.workflow \}\}-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/);
    assert.match(ciWorkflow, /cancel-in-progress: true/);
    assert.match(ciWorkflow, /node-version: \[20\.19\.0, 22\.13\.0, 24\]/);
    assert.match(ciWorkflow, /run: pnpm verify:ci/);
    assert.match(ciWorkflow, /run: pnpm smoke:published:eslint9-floor/);
    assert.match(ciWorkflow, /persist-credentials: false/);
  });

  it("pins a package manager compatible with the Node 20.19 CI floor", () => {
    assert.equal(packageJson.packageManager, "pnpm@10.34.5");
  });

  it("serializes a minimally privileged release and verifies its tag, version, and main ancestry before publishing", () => {
    assertActionPins(publishWorkflow);
    assert.match(publishWorkflow, /permissions:\n  contents: read\n  # Required for npm trusted publishing \(OIDC\) and provenance\.\n  id-token: write/);
    assert.match(publishWorkflow, /group: publish-\$\{\{ github\.repository \}\}/);
    assert.match(publishWorkflow, /cancel-in-progress: false/);
    assert.match(
      publishWorkflow,
      /ref: \$\{\{ github\.event\.release\.tag_name \}\}\n          fetch-depth: 0\n          persist-credentials: false/,
    );
    assert.match(publishWorkflow, /name: Verify release tag is reachable from main/);
    assert.match(publishWorkflow, /RELEASE_TAG: \$\{\{ github\.event\.release\.tag_name \}\}/);
    assert.match(publishWorkflow, /git rev-parse --verify "refs\/tags\/\$\{RELEASE_TAG\}\^\{commit\}"/);
    assert.match(publishWorkflow, /git merge-base --is-ancestor "\$release_commit" refs\/remotes\/origin\/main/);
    assert.ok(
      publishWorkflow.indexOf('git merge-base --is-ancestor "$release_commit" refs/remotes/origin/main')
        < publishWorkflow.indexOf("run: pnpm install --frozen-lockfile"),
    );
    assert.match(publishWorkflow, /GITHUB_REF_NAME: \$\{\{ github\.event\.release\.tag_name \}\}/);
    assert.match(publishWorkflow, /run: pnpm verify:release/);
    assert.match(publishWorkflow, /run: pnpm publish --provenance --access public --no-git-checks/);
    assert.match(publishWorkflow, /persist-credentials: false/);
  });
});
