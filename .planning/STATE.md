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
- Status: 0.5.0 metadata is cut and the full local release ladder is green;
  the integration branch is ready for review and merge
- Previous published baseline: `v0.4.0`; it is an annotated tag at `main`
  commit `9c3028a`, has a published GitHub Release, and is present on npm
- Branch: `codex/release-0.5.0-clean`

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
- The smoke consumer now pins published `eslint-plugin-anti-slop@0.4.0`
  with a lockfile integrity record; its ESLint, quality, and audit commands
  passed against the registry package. Local Git fixture subprocesses clear
  inherited repository variables so commit hooks cannot mutate the release
  index.
- `CI=true GITHUB_REF_NAME=v0.5.0 npm_config_minimum_release_age=0 pnpm
  verify:release` passed: formatting, syntax, dead-code, secrets, 351 tests,
  87.98% coverage, package dry run, registry smoke, packed `0.5.0` smoke, and
  the npm audit (0 critical/high advisories).
- The public GitHub Release is
  `https://github.com/jakyeamos/eslint-plugin-anti-slop/releases/tag/v0.4.0`.
- The earlier `0.4.0` publish workflow initially returned npm `E404`; after
  ownership and trusted-publisher configuration was corrected, npm now serves
  `0.4.0` as the latest package.
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
- Pin the deterministic smoke consumer to the exact published `0.4.0`
  baseline, and retain the packed consumer as the candidate artifact-isolation
  proof. Local `file:` installs remain documented for ad hoc development.
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
  `SECURITY.md`; publish only through the trusted GitHub Actions workflow. The
  npm ownership/trusted-publisher configuration is now verified for `0.4.0`.
- Treat dropping Node 20 as a breaking pre-1.0 compatibility change and release
  it as `0.5.0`; do not tag or publish this candidate from the feature branch.

## Next Step

Review the release diff, push `codex/release-0.5.0-clean`, merge it into
`main`, tag `v0.5.0`, and publish through the trusted workflow.

## Blockers and Risks

- Node 20 consumers must remain on the `0.4.0` line; the pending `0.5.0`
  release intentionally narrows the support range to Node 22.13 and Node 24.
- The machine enforces a 24-hour pnpm minimum release age; local registry
  smoke runs for the newly published `0.4.0` require a temporary command-line
  override until that window elapses. CI has no matching local-age blocker.
- Untracked `.agents/` and `skills/` content remains outside this branch’s
  product scope.

## Session Continuity

Last activity: 2026-07-17 — the release integration branch combines the Node
support migration, Node 24-compatible immutable workflow action pins, the
registry-backed `0.4.0` smoke baseline, and the green `0.5.0` release ladder;
the next step is review and merge to `main`.
