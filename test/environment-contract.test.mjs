import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

describe("environment contract", () => {
  it("passes the checked-in repository contract", () => {
    const output = execFileSync(process.execPath, ["scripts/check_environment_contract.mjs"], {
      cwd: root,
      encoding: "utf8",
    });
    const result = JSON.parse(output);
    assert.equal(result.schema_version, "environment-contract/v1");
    assert.equal(result.status, "pass");
    assert.equal(result.checks.context_packets, result.checks.context_packets_required);
    assert.equal(result.checks.strict_consumer_types, true);
    assert.equal(result.checks.tracked_secret_paths, 0);
  });
});
