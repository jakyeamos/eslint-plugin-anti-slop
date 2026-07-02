# Changelog

## Unreleased

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
