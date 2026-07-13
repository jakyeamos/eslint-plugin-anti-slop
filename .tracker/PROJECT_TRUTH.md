# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop` `0.3.0` (`v0.3.0` tag).
- Package manager: `pnpm`; declared runtime is Node
  `^20.19.0 || ^22.13.0 || >=24` with ESLint 9 flat config.
- M0 through M2 are complete on `codex/gpt56-modernization-audit`.
- The package publishes a plugin, quality-gate CLI, audit integration, and
  documented ESM subpaths. M0 established executable proof before public
  behavior changes begin; M1 hardened verification/release policy; M2 hardened
  gate analysis and audit migration semantics.
- `pnpm verify` is deterministic and includes source checks, coverage, package
  dry run, and a linked local-consumer smoke. `pnpm verify:ci` additionally
  requires a fresh packed-consumer install and registry dependency audit;
  `pnpm verify:release` also validates the release tag against package version.

## Public Contract

- Consumer compatibility includes local linked-checkout and packed-tarball
  installation, Node ESM import resolution, the formatter filesystem path,
  baseline/report formats, and versioned audit artifact schemas.
- Gate JSON reports use schema `1.1` with requested mode, effective policy, and
  explicit analysis status. Generated baselines remain schema `1.0`; audit
  output is now schema `1.1`, with valid legacy `1.0` history kept separate.
- Rule metadata, presets, docs URLs, and declared package types are part of the
  consumer contract even when their implementation moves internally.
- OIDC trusted publishing with npm provenance, immutable action pins, and the
  Node 20.19/22.13/24 CI matrix are retained release constraints.

## Modernization Complete Through M2

- Added executable runtime coverage for every package export, rule/preset/doc
  parity, CLI policy/format behavior, baseline persistence, and audit artifacts.
- Added a packed TypeScript consumer that compiles the public declaration surface.
- Added strict coverage, registry-audit, release-tag, and workflow-contract
  gates; exercised every public runtime export through packed consumers at
  current ESLint 9 and the 9.0.0 floor.
- Reconciled contributor and planning documents with the executable command
  matrix and current compatibility range.
- Made strict config/baseline validation and failed ESLint analysis fail closed
  in every CLI policy mode; empty changed sets are visible skipped scans.
- Added status records to JSONL, Pre-CR, and SARIF, retained requested audit
  mode, and replaced stale audit artifacts with explicit failure events.
- Versioned audit fingerprints/history and switched local smoke to `link:..`;
  packed consumer verification remains the artifact-isolation proof.

## Risks and Deferred Work

- M3 must calibrate high-severity rule false-positive boundaries and autofix
  safety without changing rule IDs.
- M4 must consolidate catalog and finding ownership after M3 fixtures establish
  the required behavioral parity.
- Legacy QR remediation is deferred pending reconciliation with the approved
  M2–M4 sequence.
- User-owned untracked `.agents/` and `skills/` directories remain untouched.
