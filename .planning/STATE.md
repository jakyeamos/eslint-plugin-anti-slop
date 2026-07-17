# Project State

## Project Reference

**Core value:** Teams should be able to enforce anti-slop rules directly in
ESLint with a simple, trustworthy integration path.

**Active plan:**
[`AUDIT.md`](../docs/modernization/AUDIT.md),
[`TARGET.md`](../docs/modernization/TARGET.md), and
[`EXEC_PLAN.md`](../docs/modernization/EXEC_PLAN.md).

## Current Position

- Phase: M5 — release hardening and cutover cleanup; Node support migration complete
- Status: 0.5.0 compatibility candidate ready for review; npm publication remains blocked
- Previous published baseline: `v0.3.0`; `v0.4.0` is an annotated tag at
  `main` commit `9c3028a` with a published GitHub Release, but is not present
  on npm
- Branch: `codex/node-support-migration`

M5 preserves the public package contract while containing configured
baseline/output paths to the repository, scanning both tracked index and
working-tree content for secrets, verifying release-tag ancestry from `main`,
and adding a private vulnerability-reporting policy.

## Current Evidence

- `CI=true pnpm verify` passed under pnpm `10.34.5` with 351 tests, 87.95%
  line coverage, a package dry run, and a rebuilt linked local-consumer smoke.
- `pnpm verify:ci` passed with the online packed-consumer smoke and required
  registry dependency audit.
- `pnpm smoke:published:eslint9-floor` passed against ESLint 9.0.0.
- The Node support candidate declares `^22.13.0 || >=24`, tests Node 22.13 and
  Node 24, removes Node 20 from the ESLint-floor job, and asserts the same
  engines metadata in linked and packed consumers.
- The Node support candidate passed `CI=true pnpm verify` with 351 tests and
  87.95% line coverage, `pnpm verify:ci` with a packed-consumer install and
  registry audit reporting 0 critical/high advisories, and the explicit ESLint
  9.0.0 floor smoke.
- `GITHUB_REF_NAME=v0.4.0 pnpm verify:release` passed, including release
  tag/version assertion, fresh packed-consumer verification, and registry audit.
- `pre-cr run --workspace .` passes after the RuleTester taxonomy split without
  an oversized-source or synthetic-secret advisory.
- The first merged-main CI run exposed pnpm `11.7.0` as incompatible with the
  promised Node `20.19.0` floor; `main` now pins pnpm `10.34.5` (Node
  `>=18.12`) and has a workflow regression assertion.
- `main` also removes Node-22-only `--test-coverage-include` usage; LCOV keeps
  its portable reporter path while the coverage gate counts only `src/`
  records.
- The final tag gate passed with 351 tests and 87.98% source line coverage;
  GitHub CI passed Node 20.19, Node 22.13, Node 24, and the ESLint 9.0.0 floor.
- The annotated `v0.4.0` tag is pushed and resolves to a commit reachable from
  `origin/main`.
- CI and publish now pin checkout `v5.0.1`, setup-node `v5.0.0`, and
  pnpm/action-setup `v4.4.0` to immutable commits using Node 24-compatible
  action runtimes; `CI=true pnpm verify` passed with 351 tests, 87.95% line
  coverage, a package dry run, and the linked ESLint 9 consumer smoke.
- The public GitHub Release is
  `https://github.com/jakyeamos/eslint-plugin-anti-slop/releases/tag/v0.4.0`.
- Publish workflow `29283070886` completed its release verification gate but
  `pnpm publish --provenance --access public --no-git-checks` received npm
  `E404` for `PUT /eslint-plugin-anti-slop`; registry lookup confirms `0.4.0`
  is not published.
- Final architecture, package, and security adversarial reviews found no
  confirmed P0, P1, or P2 finding.

## Current Decisions

- Modernize internally in place; do not create a parallel rewrite.
- Preserve published entrypoints and output behavior until a milestone
  explicitly documents a versioned change.
- Keep `pnpm verify` deterministic; reserve fresh registry resolution for the
  explicitly named CI/release checks.
- Treat empty changed-file selections as explicit skipped analysis, but reject
  empty configured file lists and every malformed config/baseline shape.
- Keep audit `1.0` history readable and schema-segregated from current `1.1`
  fingerprints; downstream consumers can archive the old JSONL before upgrade.
- Use `link:..` for current-checkout smoke and retain the packed consumer as
  the artifact-isolation proof.
- Keep high-severity rules conservative when static path, CSS cascade, or
  runtime-reference evidence cannot be proven.
- Keep the catalog an internal leaf: public facades project it, while rule
  modules, finding identity, and gate-specific analysis records remain owned
  by their existing focused modules.
- Keep the legacy QR remediation work deferred until its overlap with M2–M4 is
  resolved.
- Treat `anti-slop.config.json` path values as repository-scoped inputs,
  including their real symlink targets; explicit CLI paths remain caller-owned.
- Require a release tag to resolve to a commit reachable from `origin/main`
  before dependency installation or publication.
- Keep private GitHub vulnerability reporting enabled and direct reports to
  `SECURITY.md`; retry npm publishing only through the trusted GitHub Actions
  workflow after npm package ownership/trusted-publisher configuration is set.
- Treat dropping Node 20 as a breaking pre-1.0 compatibility change and release
  it as `0.5.0`; do not tag or publish this candidate from the feature branch.

## Next Step

Review and merge `codex/node-support-migration`, then cut `0.5.0` after the
canonical release branch contains the candidate. Separately configure npm
ownership and the trusted publisher for `jakyeamos` / `eslint-plugin-anti-slop`
/ `publish.yml` before retrying the older `0.4.0` publish; its tag and GitHub
Release must not change.

## Blockers and Risks

- npm rejected the trusted `0.4.0` publish with `E404`, so package ownership or
  trusted publisher configuration must be corrected outside this repository
  before a safe retry.
- Node 20 consumers must remain on the `0.4.0` line; the pending `0.5.0`
  release intentionally narrows the support range to Node 22.13 and Node 24.
- Untracked `.agents/` and `skills/` content remains outside this branch’s
  product scope.

## Session Continuity

Last activity: 2026-07-17 — the release integration branch combines the Node
support migration with Node 24-compatible immutable workflow action pins; the
next step is the registry-backed smoke proof and `0.5.0` release cut.
