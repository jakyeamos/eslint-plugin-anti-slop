---
id: eslint-plugin-anti-slop.examples
last_reviewed: 2026-07-28
---

# Good implementation examples

- `src/rules/no-placeholder-copy.mjs` shows a focused rule using shared AST
  helpers and explicit user-facing scope.
- `src/internal/rules/catalog.mjs` is the canonical metadata-to-public parity
  surface.
- `test/public-contract.test.mjs` verifies exports, schemas, and package-facing
  behavior rather than only internal functions.
- `test/verification-scripts.test.mjs` exercises positive, negative, security,
  and unavailable-dependency outcomes.
- `test/workflows.test.mjs` locks down CI permissions, action pins, and release
  ancestry checks.
- `scripts/check_environment_contract.mjs` is the small executable repository
  legibility contract; extend it only for durable hard invariants.
