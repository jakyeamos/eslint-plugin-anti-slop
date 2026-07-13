# Changelog

## 0.4.0 - 2026-07-13

- Consolidated rule registration, presets, metadata, documentation URLs, and
  SARIF rule descriptors behind one internal catalog without changing public
  package imports or report formats. `pnpm verify` now also rejects circular
  local imports.
- Fixed `no-demo-data-primary-path` so a computed object key that evaluates a
  fixture binding is reported rather than treated as a static property name.
- Restricted configured gate baseline and report paths to the project root,
  expanded the tracked-file secret scan beyond filename extensions and across
  staged plus working-tree content, and documented a confidential
  vulnerability-reporting route.
- Require a publish release tag to resolve to a commit reachable from `main`
  before dependencies are installed or provenance publishing begins.
- `no-unjustified-use-client` now reports for manual review instead of removing
  directives automatically, and recognizes referenced conventional imported
  hooks plus unshadowed browser APIs accessed through `globalThis`; type-only
  references and property spellings no longer count as client signals.
- `no-demo-data-primary-path` now permits a runtime fixture binding only as a
  `??` fallback to an immutable same-scope real-data result; direct fixture
  usage, unrelated calls or imports, another fixture binding, and `||` are no
  longer exempt. Transparent TypeScript value wrappers preserve the same
  runtime classification.
- `require-reduced-motion` now requires animation and transition fallbacks to
  match their motion type, ordered variant scope, selector, cascade order, and
  static non-motion media scope; it normalizes Tailwind important modifiers,
  treats nested, scoped, or layered CSS conservatively, ignores CSS comments, and
  ignores non-motion static values as sources.
- `require-empty-state-action` now uses high-confidence empty-state language
  and requires action wording or a usable control within the local empty-state
  render path; transparent TypeScript wrappers, correlated conjunctions, and
  first-legend fieldset paths are handled correctly, while disabled, hidden,
  disabled-fieldset (outside the first legend), and remote controls no longer
  satisfy the rule.
- Class-derived UI rules now evaluate mutually exclusive static class paths
  separately instead of joining branches, avoiding impossible cross-branch
  findings while preserving concrete class-builder combinations.
- Made the CLI and gate fail closed: invalid `anti-slop.config.json` files and
  malformed baselines now fail before analysis, fatal ESLint/parser failures
  are explicit non-successful analysis results in every mode, and clean
  `--changed` runs are visible no-op scans instead of full-repository fallbacks.
- Preserved requested `audit` mode in reports while exposing the effective
  warning policy and analysis status. The full JSON report now uses schema
  version `1.1`; JSONL, Pre-CR, and SARIF represent skipped or failed analysis
  explicitly.
- Moved audit output to schema `1.1`, unified its finding fingerprints with the
  gate, and recorded feature-branch findings as `finding_observed`. Existing
  audit history remains version-segregated; archive `gate-events.jsonl` before
  upgrade when a downstream consumer requires a single schema version.
- Replaced stale audit artifacts with a schema-`1.1` `analysis_failed` event
  after fatal ESLint/parser output.
- Made the deterministic local smoke consumer link to the current checkout so
  it cannot validate a stale copied `file:` dependency; packed-artifact
  isolation remains covered by the separate online smoke.
- Raised the declared Node support floor to the actual parser dependency range:
  `^20.19.0 || ^22.13.0 || >=24`.
- Pinned the repository package manager to pnpm `10.34.5` so the Node 20.19
  CI matrix and ESLint 9.0.0 floor run with a compatible client.
- Added an enforced LCOV coverage threshold and a deterministic `pnpm verify`
  gate; CI/release additionally require the online packed-consumer and registry
  audit checks through `pnpm verify:ci` and `pnpm verify:release`.
- Added packed runtime smoke coverage for every public export, TypeScript/TSX
  linting, and the ESLint 9.0.0 runtime floor.
- Hardened GitHub workflows with immutable action pins, minimum permissions,
  concurrency, release-tag/package-version validation, and an executable
  workflow contract test.

## 0.3.0 - 2026-07-09

- Plugin metadata now reads `name`/`version` from `package.json` at load time
  and declares `namespace: "anti-slop"`.
- `pnpm verify` no longer depends on the unpublished global `pre-cr` tool;
  `pnpm verify:local` layers Pre-CR readiness for machines that have it.
- CLI `ignores` now use real glob semantics via picomatch (`**/generated/**`,
  `*.stories.tsx`, `src/**/*.fixture.ts`), matching ESLint expectations.
- CLI `--mode auto` resolves the current branch from CI env vars or git when
  `--branch` is omitted, so local feature branches warn instead of blocking.
- Gate finding fingerprints now include the trimmed source line, so separate
  violations of one rule in the same file baseline independently. Existing
  baselines must be regenerated with `--update-baseline`.
- `no-unjustified-use-client` no longer counts unused react hook imports or
  props like `online` as client signals, and tracks aliased hooks correctly.
- `no-useless-memo` resolves callees through scope analysis: react imports
  (aliased included), `React.useMemo` member calls, and unresolved globals are
  checked; local functions and other modules' `useMemo` are ignored.
- `no-demo-data-primary-path` covers `app/page.tsx`, `src/app/**`, layout and
  route files, and root `pages/**`; real-data indicators must be actual call
  roots or import path segments instead of any identifier.
- Added a shared static class extractor so className-based UI rules see
  classes inside `clsx`/`classnames`/`cn`/`cx`/`cva`/`twMerge`/`twJoin` calls,
  arrays, object keys, conditionals, and template literals.
- `require-reduced-motion` checks fallbacks in proximity (same class string or
  CSS string) instead of file-wide, detects variant-prefixed motion such as
  `hover:transition` and `md:animate-spin`, and treats `motion-safe:` motion
  as guarded.
- Added per-rule options with schemas: `maxGuards`
  (`no-defensive-guard-sprawl`), `maxRadiusPx` (`no-excessive-radius`), and
  `maxZIndex` (`no-arbitrary-z-index`).
- Added `docs/rules/<rule>.md` pages for all 16 rules and wired
  `meta.docs.url` for editor integration.
- Added a release-triggered publish workflow using npm trusted publishing
  (OIDC) with provenance, and expanded CI to Node 20/22/24 plus an ESLint
  9.0.0 floor job.
- Shipped TypeScript declarations for the plugin, gate, audit, CLI, audit
  config, rule metadata, and audit formatter entry points.

## 0.2.0

- Added the `anti-slop` CLI quality gate with `check` and `gate` commands,
  stable `block`/`warn`/`audit` policy modes, changed-file mode, baseline
  support, JSON/JSONL/Pre-CR/SARIF output, and optional
  `anti-slop.config.json` project settings.
- Added a built-in JavaScript/TypeScript flat config to the CLI so adoption and
  backfill scans can run before a target repo has configured Anti-Slop in ESLint.
- Centralized rule gate metadata so audit, SARIF, and CLI remediation text stay
  in sync.
- Added `anti-slop/no-defensive-guard-sprawl` to flag ordinary functions that
  stack repeated nullish or `isRecord(...)` guards instead of centralizing shape
  validation.
- Added structural UI rules from the Impeccable quality pass:
  `anti-slop/no-gradient-text`, `anti-slop/no-decorative-grid-background`,
  `anti-slop/no-side-stripe-accent`, `anti-slop/no-excessive-radius`,
  `anti-slop/no-arbitrary-z-index`, `anti-slop/require-reduced-motion`,
  `anti-slop/no-hidden-reveal-default`, and `anti-slop/no-nested-cards`.
- Added a pnpm-based smoke consumer that installs the plugin through `file:..`
  and lints a small JSX fixture.
- Added a publish-realistic smoke test that installs the packed tarball in an
  isolated fixture and verifies the CLI plus audit-related package entrypoints.
- Synced the exported plugin metadata version with the package version and
  pinned it in the RuleTester export coverage.
- Expanded the RuleTester suite to cover every current rule and source-focused
  LCOV generation for the Pre-CR coverage gate.
- Added an AIOS-compatible audit helper and ESLint formatter for branch-aware
  Anti-Slop findings.
- Packaged the AIOS audit formatter integration with an exported
  `eslint-plugin-anti-slop/aios-audit-config`, repo-local audit script, consumer
  smoke coverage, and exact README wiring for downstream repos.
- Updated development and release docs to use the smoke consumer through
  `pnpm smoke:consumer` and `pnpm verify`.
- Updated CI to run the same `pnpm verify` gate used for local pre-PR checks,
  with pnpm caching for both the root package and smoke consumer lockfiles.
- Documented ESLint 9.x as the only supported ESLint major after an ESLint
  8.57.1 audit found that the package CLI fails under ESLint 8, and renamed the
  smoke script path to `pnpm smoke:eslint9`.

## 0.1.0

- Added seven ESLint rules for React/TypeScript UI quality checks.
- Added flat-config `recommended` and `strict` presets.
- Added RuleTester coverage for exported presets and rule behavior.
- Added CI coverage for install and test verification.
- Tightened user-facing string detection so class and styling attributes are not flagged as placeholder copy.
