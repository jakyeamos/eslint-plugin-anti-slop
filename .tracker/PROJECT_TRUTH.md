# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop` `0.4.0` candidate; M0–M5 are merged to
  `main`, while `v0.3.0` remains the released baseline and no `v0.4.0` tag or
  publication exists yet.
- Package manager: pnpm `10.34.5`; declared runtime is Node
  `^20.19.0 || ^22.13.0 || >=24` with ESLint 9 flat config.
- The release handoff is on `codex/ci-node20-pnpm-compat`: it corrects the
  Node-20/pnpm-11 setup mismatch and a Node-22-only coverage flag before the
  release tag is created.
- The package publishes a plugin, quality-gate CLI, audit integration, and
  documented ESM subpaths. M0 established executable proof before public
  behavior changes begin; M1 hardened verification/release policy; M2 hardened
  gate analysis and audit migration semantics; M3 calibrated rule evidence;
  M4 consolidated catalog ownership; M5 hardened configured paths, secret
  scanning, release ancestry, and security reporting without changing rule IDs
  or public package entrypoints.
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
- Rule metadata, presets, docs URLs, SARIF descriptors, and declared package
  types are part of the consumer contract even when their implementation moves
  internally.
- OIDC trusted publishing with npm provenance, immutable action pins, and the
  Node 20.19/22.13/24 CI matrix are retained release constraints. A release tag
  must resolve to a commit reachable from `origin/main` before publication.
- Configured baseline and output paths must resolve within the project root,
  including when existing symlinks participate. The secret scan compares both
  staged index blobs and tracked working-tree files, and fails closed on
  oversized text input.
- Private vulnerability reporting is enabled and `SECURITY.md` is the public
  reporting contract.

## Modernization Complete Through M5

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
- Replaced flattened static class evidence with possible render paths and added
  conservative static-value handling for rule consumers.
- Calibrated fixture fallback, client-signal, empty-state action, and
  reduced-motion CSS evidence with documented RuleTester boundary fixtures.
- Closed final parser/path boundary cases and passed `pnpm verify`,
  `pnpm verify:ci`, and the published ESLint 9.0.0 floor smoke (336 tests,
  87.60% line coverage in deterministic verification).
- Centralized the 16 rule bindings, remediation metadata, docs URLs, preset
  severities, and SARIF descriptors in an internal catalog; `index`,
  `rule-metadata`, and gate consumers now project that owner without public
  contract changes.
- Added a literal catalog golden and a reachable circular-local-import check;
  M4 passed `pnpm verify`, `pnpm verify:ci`, and the ESLint 9.0.0 floor smoke
  (339 tests, 87.82% line coverage in deterministic verification).

- Corrected computed-property demo-data evidence, contained configured gate
  paths against lexical and symlink escapes, and added regression coverage for
  staged/working-tree secret divergence and oversized tracked text.
- Added release-tag ancestry enforcement before publish, repository secret-file
  ignores, a security-reporting policy, and verified private GitHub
  vulnerability reporting.
- M5 passed `pnpm verify` (349 tests, 87.98% line coverage), `pnpm verify:ci`,
  the ESLint 9.0.0 published-package floor smoke, and
  `GITHUB_REF_NAME=v0.4.0 pnpm verify:release`; final adversarial reviews found
  no P0, P1, or P2.
- Replaced the 1,247-nonblank-line RuleTester fixture with one shared harness
  and focused foundation, UX, and interface suites. All 24 suite titles and
  fixtures are preserved, and Pre-CR no longer emits an oversized-source
  advisory.
- Made blocking audit-artifact fixtures explicit about their protected policy
  and synthetic secrets runtime-built, preventing tag-context semantic drift or
  static-secret advisories.
- Merged-main CI exposed pnpm 11.7.0 as incompatible with Node 20.19.0; the
  focused corrective branch pins pnpm 10.34.5 (Node `>=18.12`) and locks that
  compatibility with a workflow test. It also preserves source-only coverage
  enforcement without the Node-22-only coverage include flag.

## Risks and Deferred Work

- Remote confirmation of the pnpm 10 CI fix is pending before the authorized
  `v0.4.0` tag; GitHub release and package publication remain separate actions.
- Legacy QR remediation is deferred pending reconciliation with the approved
  M2–M4 sequence.
- User-owned untracked `.agents/` and `skills/` directories remain untouched.
