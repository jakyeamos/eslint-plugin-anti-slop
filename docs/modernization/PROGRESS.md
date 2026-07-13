# Modernization Progress

## Current Position

**Phase:** M5 — release hardening and cutover cleanup complete
**Branch:** `codex/ci-node20-pnpm-compat` (release-handoff corrective branch)
**Baseline:** `v0.3.0`
**Candidate:** `0.4.0` (M0–M5 merged to `main`; not tagged or published)
**Application behavior changed:** configured gate paths and release defenses
are stricter; public package entrypoints and report formats remain preserved

## Completed

- Established the `v0.3.0` baseline and ran the package verification suite.
- Audited architecture, rule behavior, public contracts, packaging, CI,
  release, declarations, documentation, and project-state files.
- Created `AUDIT.md`, `TARGET.md`, and `EXEC_PLAN.md` with an in-place
  modernization strategy.
- Added runtime contract coverage for every package export, presets, rule docs,
  CLI formats/modes, baselines, and audit artifacts.
- Added a packed TypeScript consumer that compiles every public declaration
  subpath with `--noEmit`.
- Reconciled contributor and project-state documents with the v0.3.0 baseline.
- Separated deterministic `pnpm verify` from the online packed-consumer and
  supply-chain checks required by `pnpm verify:ci` and `pnpm verify:release`.
- Added an enforced LCOV threshold, a strict registry-audit mode, release-tag
  validation, and executable workflow contract tests.
- Hardened CI/release workflows with exact Node floors, immutable action pins,
  minimum permissions, serialized publishing, and credential-free checkout.
- Exercised every public runtime export and TypeScript/TSX lint path through a
  packed consumer at current ESLint 9 and the 9.0.0 runtime floor.
- Corrected the Node compatibility promise to
  `^20.19.0 || ^22.13.0 || >=24` and pinned the parser version that establishes
  that floor.
- Validated `anti-slop.config.json` and baseline input before ESLint runs;
  malformed input now exits non-successfully without overwriting a baseline.
- Represented complete, skipped, and failed analysis separately from gate
  policy, including explicit JSONL, Pre-CR, SARIF, and text outcomes.
- Preserved requested `audit` mode, made fatal analysis fail in every policy
  mode, and made an empty changed set a visible no-op rather than a full scan.
- Moved audit events to schema `1.1`, separated legacy/current fingerprint
  history, and documented the optional archive migration for single-schema
  downstream consumers.
- Linked the deterministic local smoke directly to the current checkout;
  packed-artifact isolation remains an independent online check.
- Replaced flattened static class evidence with possible class/render paths and
  updated all structural rule consumers to inspect each path.
- Calibrated demo-data, use-client, empty-state, and reduced-motion evidence
  with runtime-reference, condition, CSS-scope, and accessibility boundaries.
- Preserved rule IDs and deliberately retained manual review for
  `no-unjustified-use-client` rather than adding an unsafe fixer.
- Identified no data, authentication, billing, or infrastructure migration.
- Preserved user-owned untracked `.agents/` and `skills/` directories.

## M1 Results

- M0 contract freeze passed its full package verification gate.
- `pnpm verify`: passed (164 tests, 93.17% line coverage, package dry-run, and
  locked local-consumer smoke).
- `pnpm verify:ci`: passed (including the online packed-consumer smoke and a
  required registry audit with no high-or-higher advisories).
- `pnpm smoke:published:eslint9-floor`: passed against ESLint 9.0.0.
- Final adversarial M1 review found no P0, P1, or P2 issue.

## M2 Results

- `pnpm verify`: passed (180 tests, 93.44% line coverage, package dry-run, and
  linked local-consumer smoke).
- `pnpm verify:ci`: passed (including packed-consumer smoke and a required
  registry audit with no high-or-higher advisories).
- `pnpm smoke:published:eslint9-floor`: passed against ESLint 9.0.0.
- Public declaration compilation and the final adversarial review passed with
  no confirmed P0, P1, or P2 findings.

## M3 Results

- `pnpm verify`: passed (336 tests, 87.60% line coverage, package dry-run, and
  linked local-consumer smoke).
- `pnpm verify:ci`: passed with the online packed-consumer smoke and required
  registry dependency audit.
- `pnpm smoke:published:eslint9-floor`: passed against ESLint 9.0.0.
- Final adversarial reviews found and closed static-path and CSS quote/parser
  boundary cases; no confirmed P0, P1, or P2 finding remains.

## M4 Results

- Added `src/internal/rules/catalog.mjs` as the one production owner of the 16
  rule bindings, remediation metadata, docs URLs, preset severities, and SARIF
  rule descriptors.
- Kept `src/index.mjs` and `src/rule-metadata.mjs` as stable public facades;
  finding identity remains in `src/finding-core.mjs`, and gate-only analysis
  SARIF records remain local to `src/gate.mjs`.
- Replaced in-place rule-module docs URL mutation with decorated plugin rule
  projections, preserving all declared package imports and report formats.
- Added a literal catalog golden plus a reachable circular-local-import check
  to prevent coordinated catalog drift or an internal dependency loop.
- `pnpm verify` passed with 339 tests, 87.82% line coverage, package dry run,
  and linked local-consumer smoke; `pnpm verify:ci` and the ESLint 9.0.0 packed
  smoke also passed.
- Final adversarial review found no confirmed P0, P1, or P2 finding.

## M5 Results

- Corrected static computed-property handling in `no-demo-data-primary-path`
  while retaining static object-property false-positive coverage.
- Contained configured baseline and report paths to the real repository root,
  including existing directory and final-file symlink escapes.
- Reworked the secret scan to compare tracked index blobs with tracked
  working-tree bytes, ignore untracked files, avoid leaking literals, and fail
  closed on oversized text inputs.
- Added release-tag ancestry validation before installation or publication,
  repository secret-file ignores, and `SECURITY.md`; private GitHub
  vulnerability reporting is enabled.
- M5 passed `pnpm verify` (349 tests, 87.98% line coverage), `pnpm verify:ci`,
  `pnpm smoke:published:eslint9-floor`, and
  `GITHUB_REF_NAME=v0.4.0 pnpm verify:release`.
- Final architecture, package, and security adversarial reviews found no
  confirmed P0, P1, or P2 finding.
- Replaced the oversized legacy RuleTester fixture with one shared harness and
  focused foundation, UX, and interface suites; all 24 suite titles and
  fixtures remain unchanged, and Pre-CR is advisory-free.
- Made audit-artifact fixtures select their protected policy explicitly and
  construct synthetic secrets at runtime, so tag-context validation cannot
  change their expected semantics or trigger static-secret advisories.
- Merged-main CI exposed pnpm 11.7.0 as incompatible with the declared Node
  20.19 floor. The focused handoff branch pins pnpm 10.34.5 (Node `>=18.12`),
  adds a workflow regression assertion, and passes `CI=true pnpm verify`
  (350 tests, 87.95% line coverage) with a rebuilt pnpm-10 smoke consumer.

## Release Handoff

Merge the reviewed pnpm compatibility fix to `main` and confirm the Node 20.19
and ESLint 9.0.0-floor CI jobs before creating the `v0.4.0` tag. The workflow
verifies that the tag commit is reachable from `main`; no tag or package
publication occurred in this modernization work.

## Known Risks

- The untracked `skills/` directory is stale but outside this branch's owned
  tracked product surface.
