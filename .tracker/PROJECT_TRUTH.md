# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop` `0.3.0` (`v0.3.0` tag).
- Package manager: `pnpm`; runtime remains Node 20+ with ESLint 9 flat config.
- M0 is complete on `codex/gpt56-modernization-audit`.
- The package publishes a plugin, quality-gate CLI, audit integration, and
  documented ESM subpaths. M0 established executable proof before public
  behavior changes begin.
- `pnpm verify` is the standard test and package-smoke gate; `verify:local`
  additionally invokes globally installed Pre-CR. CI and release currently run
  `pnpm verify`.

## Public Contract

- Consumer compatibility includes local `file:..` installation, packed-tarball
  installation, Node ESM import resolution, the formatter filesystem path,
  baseline/report formats, and audit artifact schema.
- Rule metadata, presets, docs URLs, and declared package types are part of the
  consumer contract even when their implementation moves internally.
- OIDC trusted publishing with npm provenance and the Node 20/22/24 CI matrix
  are retained release constraints.

## M0 Complete

- Added executable runtime coverage for every package export, rule/preset/doc
  parity, CLI policy/format behavior, baseline persistence, and audit artifacts.
- Added a packed TypeScript consumer that compiles the public declaration surface.
- Reconciled contributor and planning documents with the released v0.3.0
  baseline without changing the accurate README verification matrix.

## Risks and Deferred Work

- M2 must make malformed config and failed analysis unable to appear as a
  successful gate result.
- `pnpm verify` intentionally omits some quality and supply-chain scripts; M1
  will make deterministic and network-dependent policy explicit.
- Legacy QR remediation is deferred pending reconciliation with the approved
  M2–M4 sequence.
- User-owned untracked `.agents/` and `skills/` directories remain untouched.
