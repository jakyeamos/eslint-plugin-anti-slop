# Modernization Progress

## Current Position

**Phase:** M3 — high-severity rule evidence calibration complete
**Branch:** `codex/gpt56-modernization-audit`
**Baseline:** `v0.3.0`
**Application behavior changed:** rule evidence, static-path handling, and
reduced-motion/empty-state boundaries

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

## Next Milestone

Begin M4: consolidate catalog and finding ownership behind one internal source
of truth without changing public entrypoints, rule IDs, or report formats.

## Known Risks

- Rule catalog ownership remains split across modules; M4 must preserve M3's
  parity fixtures while eliminating duplicate registry/metadata ownership.
- The untracked `skills/` directory is stale but outside this branch's owned
  tracked product surface.
