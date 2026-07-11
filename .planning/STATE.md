# Project State

## Project Reference

**Core value:** Teams should be able to enforce anti-slop rules directly in
ESLint with a simple, trustworthy integration path.

**Active plan:**
[`AUDIT.md`](../docs/modernization/AUDIT.md),
[`TARGET.md`](../docs/modernization/TARGET.md), and
[`EXEC_PLAN.md`](../docs/modernization/EXEC_PLAN.md).

## Current Position

- Phase: M0 — public-contract freeze and truth reconciliation
- Status: Complete
- Baseline: `v0.3.0`
- Branch: `codex/gpt56-modernization-audit`

M0 added executable proof for existing behavior only. It did not change rule,
CLI, audit, or package semantics.

## Current Evidence

- The v0.3.0 baseline passed `pnpm verify`, package build, syntax, formatting,
  reachability, secret, and dependency-security checks.
- The modernized contract suite passed with 157 tests and covers package
  exports, rules/presets/docs, audit artifacts, CLI policy/format behavior,
  baselines, and packed type consumption.
- The public verification commands and release workflow remain the source of
  truth for executable behavior; this file records only the current work state.

## Current Decisions

- Modernize internally in place; do not create a parallel rewrite.
- Preserve published entrypoints and output behavior until a milestone
  explicitly documents a versioned change.
- Keep the legacy QR remediation work deferred until its overlap with M2–M4 is
  resolved.

## Next Step

Begin M1: define the authoritative deterministic verification gate and the
release policy for network-dependent supply-chain checks.

## Blockers and Risks

- No external blocker.
- M2 must address configuration and parser failures that can currently be
  represented as a passing gate.
- Untracked `.agents/` and `skills/` content remains outside this branch’s
  product scope.

## Session Continuity

Last activity: 2026-07-10 — M0 contract tests, packed type fixture, and state
reconciliation committed after full verification.
