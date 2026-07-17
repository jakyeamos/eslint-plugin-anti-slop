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

The `v0.3.0` release remains the npm-published baseline, `v0.4.0` is the
published GitHub Release that remains absent from npm, and this branch carries
a verified, not-yet-published `0.5.0` compatibility candidate. The development
contract supports Node `^22.13.0 || >=24` and ESLint 9 flat config,
separates a deterministic local gate from explicit online package/supply-chain
checks, and publishes through a hardened OIDC/provenance workflow. M0 through
M5 are complete: M5 hardens configured path containment, secret scanning,
release ancestry, and security reporting while preserving public entrypoints,
rule IDs, and report formats.

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
| Separate deterministic and online verification | Fresh consumer installs and registry audits are valuable but must not masquerade as offline checks. | M1 complete |
| Version audit identity when its fingerprint changes | Preserve readable legacy history without coalescing it with the current gate identity. | M2 complete |
| Calibrate static rule evidence before catalog work | Possible render/class paths and consumer-shaped fixtures prevent false confidence from flattened or guessed analysis. | M3 complete |
| Keep a one-owner model for future internals | Registry, metadata, docs URLs, and report identity must not drift independently. | M4 complete |
| Harden release boundaries before publication | Configured paths, repository secrets, and release-tag ancestry must be verified from authoritative project state. | M5 complete |

---
*Last updated: 2026-07-17*
