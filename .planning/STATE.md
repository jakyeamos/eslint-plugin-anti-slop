# Project State

## Project Reference

**Core value:** Teams should be able to enforce anti-slop rules directly in
ESLint with a simple, trustworthy integration path.

**Active plan:**
[`AUDIT.md`](../docs/modernization/AUDIT.md),
[`TARGET.md`](../docs/modernization/TARGET.md), and
[`EXEC_PLAN.md`](../docs/modernization/EXEC_PLAN.md).

## Current Position

- Phase: M1 — verification and release gate
- Status: Complete
- Baseline: `v0.3.0`
- Branch: `codex/gpt56-modernization-audit`

M1 changed package-development and release policy only. It did not change rule,
CLI, audit, or package semantics.

## Current Evidence

- `pnpm verify` passed with 164 tests, 93.17% line coverage, a package dry run,
  and a locked local-consumer smoke.
- `pnpm verify:ci` passed with the online packed-consumer smoke and a required
  registry audit reporting no high-or-higher advisories.
- The packed runtime surface passed at current ESLint 9 and at the 9.0.0 floor;
  workflow contract tests cover pins, permissions, concurrency, and release
  tag/version validation.

## Current Decisions

- Modernize internally in place; do not create a parallel rewrite.
- Preserve published entrypoints and output behavior until a milestone
  explicitly documents a versioned change.
- Keep `pnpm verify` deterministic; reserve fresh registry resolution for the
  explicitly named CI/release checks.
- Keep the legacy QR remediation work deferred until its overlap with M2–M4 is
  resolved.

## Next Step

Begin M2: make invalid configuration, malformed baselines, and failed analysis
unable to appear as passing gate results.

## Blockers and Risks

- No external blocker.
- M2 must address configuration and parser failures that can currently be
  represented as a passing gate.
- Untracked `.agents/` and `skills/` content remains outside this branch’s
  product scope.

## Session Continuity

Last activity: 2026-07-13 — M1 verification/release hardening committed after
deterministic, online CI, and ESLint-floor validation.
