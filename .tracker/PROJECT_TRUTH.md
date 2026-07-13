# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop` `0.3.0` (`v0.3.0` tag).
- Package manager: `pnpm`; declared runtime is Node
  `^20.19.0 || ^22.13.0 || >=24` with ESLint 9 flat config.
- M0 and M1 are complete on `codex/gpt56-modernization-audit`.
- The package publishes a plugin, quality-gate CLI, audit integration, and
  documented ESM subpaths. M0 established executable proof before public
  behavior changes begin; M1 hardened the verification and release policy.
- `pnpm verify` is deterministic and includes source checks, coverage, package
  dry run, and a locked local-consumer smoke. `pnpm verify:ci` additionally
  requires a fresh packed-consumer install and registry dependency audit;
  `pnpm verify:release` also validates the release tag against package version.

## Public Contract

- Consumer compatibility includes local `file:..` installation, packed-tarball
  installation, Node ESM import resolution, the formatter filesystem path,
  baseline/report formats, and audit artifact schema.
- Rule metadata, presets, docs URLs, and declared package types are part of the
  consumer contract even when their implementation moves internally.
- OIDC trusted publishing with npm provenance, immutable action pins, and the
  Node 20.19/22.13/24 CI matrix are retained release constraints.

## Modernization Complete Through M1

- Added executable runtime coverage for every package export, rule/preset/doc
  parity, CLI policy/format behavior, baseline persistence, and audit artifacts.
- Added a packed TypeScript consumer that compiles the public declaration surface.
- Added strict coverage, registry-audit, release-tag, and workflow-contract
  gates; exercised every public runtime export through packed consumers at
  current ESLint 9 and the 9.0.0 floor.
- Reconciled contributor and planning documents with the executable command
  matrix and current compatibility range.

## Risks and Deferred Work

- M2 must make malformed config and failed analysis unable to appear as a
  successful gate result.
- M2 must preserve v0.3-compatible valid reports while separating requested
  mode, effective policy, and failed/skipped analysis status.
- Legacy QR remediation is deferred pending reconciliation with the approved
  M2–M4 sequence.
- User-owned untracked `.agents/` and `skills/` directories remain untouched.
