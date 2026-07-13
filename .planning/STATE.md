# Project State

## Project Reference

**Core value:** Teams should be able to enforce anti-slop rules directly in
ESLint with a simple, trustworthy integration path.

**Active plan:**
[`AUDIT.md`](../docs/modernization/AUDIT.md),
[`TARGET.md`](../docs/modernization/TARGET.md), and
[`EXEC_PLAN.md`](../docs/modernization/EXEC_PLAN.md).

## Current Position

- Phase: M3 — high-severity rule evidence calibration
- Status: Complete
- Baseline: `v0.3.0`
- Branch: `codex/gpt56-modernization-audit`

M3 keeps rule IDs and public package entrypoints stable while making rule
evidence path-sensitive and conservative: class utilities evaluate possible
static paths, runtime fixture/client signals resolve actual references, local
empty-state actions preserve usable sibling wording, and reduced-motion CSS
requires a scoped, cascade-valid static fallback.

## Current Evidence

- `pnpm verify` passed with 336 tests, 87.60% line coverage, a package dry run,
  and a linked local-consumer smoke.
- `pnpm verify:ci` passed with the online packed-consumer smoke and required
  registry dependency audit.
- `pnpm smoke:published:eslint9-floor` passed against ESLint 9.0.0.
- Final adversarial reviews closed the rule boundary cases with no remaining
  confirmed P0, P1, or P2 finding.

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
- Keep the legacy QR remediation work deferred until its overlap with M2–M4 is
  resolved.

## Next Step

Begin M4: consolidate catalog and finding ownership behind one internal source
of truth while preserving every public entrypoint and report contract.

## Blockers and Risks

- No external blocker.
- M4 must retain M3's rule fixtures while removing duplicate registry,
  metadata, and finding-identity ownership.
- Untracked `.agents/` and `skills/` content remains outside this branch’s
  product scope.

## Session Continuity

Last activity: 2026-07-13 — M3 evidence calibration committed as `80d1797`
after deterministic, online CI, and ESLint-floor validation.
