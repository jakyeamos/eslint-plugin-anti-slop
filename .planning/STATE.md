# Project State

## Project Reference

**Core value:** Teams should be able to enforce anti-slop rules directly in
ESLint with a simple, trustworthy integration path.

**Active plan:**
[`AUDIT.md`](../docs/modernization/AUDIT.md),
[`TARGET.md`](../docs/modernization/TARGET.md), and
[`EXEC_PLAN.md`](../docs/modernization/EXEC_PLAN.md).

## Current Position

- Phase: M5 — release hardening and cutover cleanup
- Status: release handoff — CI compatibility fix pending merge
- Released baseline: `v0.3.0`; candidate: `0.4.0` is merged to `main` but not
  tagged or published
- Branch: `codex/ci-node20-pnpm-compat`

M5 preserves the public package contract while containing configured
baseline/output paths to the repository, scanning both tracked index and
working-tree content for secrets, verifying release-tag ancestry from `main`,
and adding a private vulnerability-reporting policy.

## Current Evidence

- `CI=true pnpm verify` passed under pnpm `10.34.5` with 350 tests, 87.95%
  line coverage, a package dry run, and a rebuilt linked local-consumer smoke.
- `pnpm verify:ci` passed with the online packed-consumer smoke and required
  registry dependency audit.
- `pnpm smoke:published:eslint9-floor` passed against ESLint 9.0.0.
- `GITHUB_REF_NAME=v0.4.0 pnpm verify:release` passed, including release
  tag/version assertion, fresh packed-consumer verification, and registry audit.
- `pre-cr run --workspace .` passes after the RuleTester taxonomy split without
  an oversized-source or synthetic-secret advisory.
- The first merged-main CI run exposed pnpm `11.7.0` as incompatible with the
  promised Node `20.19.0` floor; the corrective branch pins pnpm `10.34.5`
  (Node `>=18.12`) and adds a workflow regression assertion.
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
  `SECURITY.md`; do not publish or tag from this branch.

## Next Step

Merge the reviewed pnpm compatibility fix to `main`, confirm the Node 20.19 and
ESLint 9.0.0-floor CI jobs, then create the `v0.4.0` tag. A GitHub release and
package publication remain separate external actions.

## Blockers and Risks

- Pending remote CI confirmation of the pnpm 10 compatibility fix; publication
  remains an intentional external action.
- Untracked `.agents/` and `skills/` content remains outside this branch’s
  product scope.

## Session Continuity

Last activity: 2026-07-13 — main CI revealed pnpm 11 cannot run on the declared
Node 20.19 floor. `4f3cb1e` pins pnpm 10.34.5 and guards that compatibility.
