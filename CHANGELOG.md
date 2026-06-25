# Changelog

## Unreleased

- Added the `anti-slop` CLI quality gate with `check` and `gate` commands,
  stable `block`/`warn`/`audit` policy modes, changed-file mode, baseline
  support, JSON/JSONL/Pre-CR/SARIF output, and optional
  `anti-slop.config.json` project settings.
- Centralized rule gate metadata so audit, SARIF, and CLI remediation text stay
  in sync.
- Added `anti-slop/no-defensive-guard-sprawl` to flag ordinary functions that
  stack repeated nullish or `isRecord(...)` guards instead of centralizing shape
  validation.
- Added a pnpm-based smoke consumer that installs the plugin through `file:..`
  and lints a small JSX fixture.
- Expanded the RuleTester suite to cover every current rule and source-focused
  LCOV generation for the Pre-CR coverage gate.
- Added an AIOS-compatible audit helper and ESLint formatter for branch-aware
  Anti-Slop findings.
- Updated development and release docs to use the smoke consumer through
  `pnpm smoke:consumer` and `pnpm verify`.

## 0.1.0

- Added seven ESLint rules for React/TypeScript UI quality checks.
- Added flat-config `recommended` and `strict` presets.
- Added RuleTester coverage for exported presets and rule behavior.
- Added CI coverage for install and test verification.
- Tightened user-facing string detection so class and styling attributes are not flagged as placeholder copy.
