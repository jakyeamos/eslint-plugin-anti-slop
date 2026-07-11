# eslint-plugin-anti-slop

## What This Is

`eslint-plugin-anti-slop` is a published ESM ESLint plugin for React and
TypeScript product-quality signals. Its public surface includes flat-config
presets, a quality-gate CLI, audit integration, and documented package
subpaths. The current product contract lives in `package.json`, `README.md`,
`docs/rules/`, and the executable contract tests.

## Core Value

Teams should be able to enforce anti-slop rules directly in ESLint with a
simple, trustworthy integration path.

## Current Position

The `v0.3.0` release is the baseline. It supports Node 20+ and ESLint 9 flat
config, has a local and packed consumer smoke path, and publishes through an
OIDC/provenance workflow. Modernization M0 is complete: the published contract
is executable and the project’s operating documents match the released
baseline. M1 can now harden verification and release behavior before changing
gate or rule behavior.

## Constraints

- Public package imports, CLI behavior, report/baseline formats, formatter
  paths, and rule configuration are consumer contracts.
- Local `file:..` development and packed-tarball installation must remain
  supported.
- Rules optimize for high-confidence, actionable findings rather than broad
  style enforcement.
- Internal refactoring must retain the package’s simple Node ESM delivery until
  a demonstrated consumer benefit justifies a different model.

## Deliberate Non-Goals

- Growing the catalog before existing high-severity rules have consumer-shaped
  evidence and false-positive coverage.
- Replacing the package with a framework, application shell, or generic rule
  DSL.
- Changing public rule IDs, CLI formats, fingerprints, or package entrypoints
  without an explicit release and migration decision.

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Modernize in place from `v0.3.0` | The package already has meaningful consumer and package coverage; a parallel rewrite adds semver risk without product value. | Active |
| Freeze contracts before behavior changes | Rule, CLI, audit, and package changes need consumer-level proof. | M0 complete |
| Keep a one-owner model for future internals | Registry, metadata, docs URLs, and report identity must not drift independently. | Planned for M4 |

---
*Last updated: 2026-07-10*
