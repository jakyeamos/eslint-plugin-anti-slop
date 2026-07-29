---
id: eslint-plugin-anti-slop.failure-modes
last_reviewed: 2026-07-28
---

# Common failure modes

- A warning-only Anti-Slop audit can still return a nonzero formatter result;
  inspect the generated summary and distinguish warnings from blocking rules.
- Registry-dependent consumer smoke and dependency audits can be unavailable
  offline; do not substitute local-only evidence for the online gate.
- Node 20 and ESLint 8 are outside the supported compatibility contract.
- Changing a rule without updating its catalog, docs, and both valid and
  invalid fixtures creates public-contract drift.
- Strict consumer type failures identify declaration/API debt. Keep strictness
  enabled and fix the owning declaration or fixture rather than suppressing it.
- Baseline or report paths that escape the project root are unsafe and must be
  rejected before analysis or writes.
