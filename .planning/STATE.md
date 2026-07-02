# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-10)

**Core value:** Teams should be able to enforce anti-slop rules directly in ESLint with a simple, local integration path.
**Current focus:** 0.2.0 release candidate prepared

## Current Position

Phase: Product hardening follow-up
Plan: Tier-one readiness improvements
Status: Complete
Last activity: 2026-07-02 - Prepared the unpublished 0.2.0 release candidate with main reconciled, package version bumped, changelog released, release docs updated, and `pnpm verify` passing

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: Stable

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Bootstrap]: Initialized GSD planning state for this brownfield repo
- [Product hardening]: Added RuleTester coverage, flat-config presets, pnpm-based docs, CI, changelog, MIT license, package metadata, package smoke verification, and Pre-CR coverage gating.
- [Workflow hardening]: Added repo-local `AGENTS.md`, `CONTRIBUTING.md`, `docs/rule-authoring.md`, PR template, and a single `pnpm verify` command for local pre-PR verification.
- [CI verification]: GitHub Actions now runs the same `pnpm verify` gate as local pre-PR development, with pnpm caching keyed by both the root and smoke-consumer lockfiles.
- [Consumer rollout]: Narrowed user-facing JSX attribute detection to copy-bearing attributes after installation in local apps surfaced className false positives.
- [Consumer smoke]: Added `smoke-consumer/` as a pnpm-managed local file dependency check and included it in `pnpm verify`.
- [Coverage hardening]: Focused `pnpm test` and `pnpm test:coverage` on the RuleTester suite, with source LCOV output for the Pre-CR coverage gate.
- [Gate audit]: Added `eslint-plugin-anti-slop/audit` and `eslint-plugin-anti-slop/audit-formatter` so Anti-Slop ESLint results can write branch-aware `.aios/audit/` JSONL, summary, and learning artifacts.
- [Audit formatter packaging]: Added `eslint-plugin-anti-slop/aios-audit-config`, a root `audit-formatter.mjs` shim for ESLint CLI path loading, repo-local and smoke-consumer audit scripts, README consumer wiring, and tests that pin the AIOS JSONL event envelope.
- [Guard sprawl]: Added `anti-slop/no-defensive-guard-sprawl` as a code-structure slop signal for repeated nullish or `isRecord(...)` guards outside centralized validation helpers.
- [Quality gate CLI]: Added the `anti-slop` binary with `check` and `gate` commands, stable policy modes, changed-file support, baselines, JSON/JSONL/Pre-CR/SARIF output, optional `anti-slop.config.json`, built-in JavaScript/TypeScript CLI scanning for backfill adoption, and smoke-consumer coverage through `pnpm verify`.
- [ESLint compatibility]: Active sibling consumers include both ESLint 8.57.1 and ESLint 9.39.4 installs. ESLint 8.57.1 can run the flat-config smoke fixture, but the installed `anti-slop` CLI fails under ESLint 8 because that major rejects the ESLint 9 `overrideConfigFile: true` option. The package contract is therefore explicit ESLint 9.x support only, with the smoke path named `pnpm smoke:eslint9`.
- [Structural UI rules]: Added Impeccable-derived deterministic UI rules to the recommended and strict presets while keeping subjective design judgment out of ESLint.
- [Published smoke]: Added a temp-fixture smoke test that installs the packed tarball, exercises the installed `anti-slop` binary, imports the `audit`, `gate`, and `aios-audit-config` subpath exports, verifies the audit formatter path through ESLint, and runs from `pnpm verify`.
- [0.2.0 release prep]: Reconciled `codex/tier-one-product-hardening` with `origin/main`, bumped `package.json` to 0.2.0, moved `CHANGELOG.md` out of Unreleased, updated release-facing docs, and verified without publishing.

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-06-23 00:00
Stopped at: Product hardening complete on codex/tier-one-product-hardening
Resume file: None
