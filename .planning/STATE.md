# Project State

## Project Reference

**Core value:** Teams should be able to enforce anti-slop rules directly in
ESLint with a simple, trustworthy integration path.

**Active plan:**
[`AUDIT.md`](../docs/modernization/AUDIT.md),
[`TARGET.md`](../docs/modernization/TARGET.md), and
[`EXEC_PLAN.md`](../docs/modernization/EXEC_PLAN.md).

## Current Position

- Phase: M4 — catalog and finding ownership consolidation
- Status: Complete
- Baseline: `v0.3.0`
- Branch: `codex/gpt56-modernization-audit`

M4 makes `src/internal/rules/catalog.mjs` the single production owner of rule
bindings, metadata, documentation URLs, presets, and SARIF descriptors.
Finding normalization and fingerprinting remain in their existing canonical
owner; every public package entrypoint and report format stays stable.

## Current Evidence

- `pnpm verify` passed with 339 tests, 87.82% line coverage, a package dry run,
  and a linked local-consumer smoke.
- `pnpm verify:ci` passed with the online packed-consumer smoke and required
  registry dependency audit.
- `pnpm smoke:published:eslint9-floor` passed against ESLint 9.0.0.
- Final adversarial review found no confirmed P0, P1, or P2 finding.

## Current Decisions

- Modernize internally in place; do not create a parallel rewrite.
- Preserve published entrypoints and output behavior until a milestone
  explicitly documents a versioned change.
- Keep `pnpm verify` deterministic; reserve fresh registry resolution for the
  explicitly named CI/release checks.
- Treat empty changed-file selections as explicit skipped analysis, but reject
  empty configured file lists and every malformed config/baseline shape.
- Keep audit `1.0` history readable and schema-segregated from current `1.1`
  fingerprints; downstream consumers can archive the old JSONL before upgrade.
- Use `link:..` for current-checkout smoke and retain the packed consumer as
  the artifact-isolation proof.
- Keep high-severity rules conservative when static path, CSS cascade, or
  runtime-reference evidence cannot be proven.
- Keep the catalog an internal leaf: public facades project it, while rule
  modules, finding identity, and gate-specific analysis records remain owned
  by their existing focused modules.
- Keep the legacy QR remediation work deferred until its overlap with M2–M4 is
  resolved.

## Next Step

Begin M5: complete cutover, release-readiness review, and cleanup against the
`v0.3.0` baseline without adding migration debris.

## Blockers and Risks

- No external blocker.
- M5 must retain the public compatibility proof while auditing the full branch
  for release, package, documentation, and cleanup risks.
- Untracked `.agents/` and `skills/` content remains outside this branch’s
  product scope.

## Session Continuity

Last activity: 2026-07-13 — M4 catalog consolidation committed as `b3cfce2`
after deterministic, online CI, and ESLint-floor validation.
