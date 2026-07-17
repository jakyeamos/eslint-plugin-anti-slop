# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop` `0.4.0`; M0–M5 and the final Node 20
  compatibility fixes are merged to `main`. The pending release integration
  branch is a `0.5.0` pre-1.0 compatibility candidate. `v0.4.0` is an
  annotated tag at commit `9c3028a`, has a published GitHub Release, and is
  now the npm-published baseline.
- Package manager: pnpm `10.34.5`; the pending candidate declares Node
  `^22.13.0 || >=24` with ESLint 9 flat config and CI coverage on Node 22.13
  and Node 24.
- CI and publish pin checkout `v5.0.1`, setup-node `v5.0.0`, and
  pnpm/action-setup `v4.4.0` to immutable commits using Node 24-compatible
  action runtimes.
- The final release handoff corrected the Node-20/pnpm-11 setup mismatch and a
  Node-22-only coverage flag before `v0.4.0` was tagged.
- The release workflow ran its complete verification gate, then npm returned
  `E404` for the provenance publish. The registry confirms `0.4.0` is absent;
  npm ownership or trusted-publisher setup is the remaining external blocker.
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
- OIDC trusted publishing with npm provenance, immutable Node-24-compatible
  action pins, and the Node 22.13/24 CI matrix are retained release
  constraints for the pending candidate. A release tag must resolve to a
  commit reachable from
  `origin/main` before publication.
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
- Migrated CI and publish action runtimes to Node 24-compatible immutable pins;
  `CI=true pnpm verify` passed with 351 tests, 87.95% line coverage, package
  dry run, and linked ESLint 9 consumer smoke.
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
- Merged-main CI exposed pnpm 11.7.0 as incompatible with Node 20.19.0; main
  now pins pnpm 10.34.5 (Node `>=18.12`) and locks that compatibility with a
  workflow test. It also preserves source-only coverage enforcement without
  the Node-22-only coverage include flag.
- The final release-tag gate passed with 351 tests and 87.98% source line
  coverage, and GitHub CI passed Node 20.19, Node 22.13, Node 24, and the
  ESLint 9.0.0 floor.
- The pending Node support migration passed `CI=true pnpm verify` with 351 tests
  and 87.95% line coverage, `pnpm verify:ci` with a packed-consumer install and
  registry audit reporting 0 critical/high advisories, and the explicit ESLint
  9.0.0 floor smoke. Linked and packed consumers assert the declared engines
  metadata.

## Risks and Deferred Work

- The GitHub Release is public, but npm package ownership or its trusted
  publisher configuration must be corrected before retrying the failed publish
  workflow. Legacy QR remediation remains separate work.
- Legacy QR remediation is deferred pending reconciliation with the approved
  M2–M4 sequence.
- Dropping Node 20 is an intentional breaking support-policy change in the 0.x
  series; release the candidate as `0.5.0` after review and merge. Node 20
  consumers remain supported by the `0.4.0` line only.
- User-owned untracked `.agents/` and `skills/` directories remain untouched.
