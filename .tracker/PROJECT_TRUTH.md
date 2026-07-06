# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop`
- Package manager: `pnpm`
- `dependency:security` runs `scripts/dependency-security.mjs`: fails only on real high/critical advisories, skips (exit 0) on registry/network errors so the offline AIOS commit gate no longer false-blocks.
- Current release candidate: `0.2.0` (unreleased hardening pass recorded in CHANGELOG "Unreleased")
- Plugin metadata is derived from `package.json` at load time and declares `namespace: "anti-slop"`.
- Primary verification command: `pnpm verify` (reproducible, no global tools); `pnpm verify:local` adds Pre-CR readiness for machines with the global `pre-cr`.
- Runtime dependencies: `@typescript-eslint/parser`, `picomatch` (CLI glob ignores).
- CLI: glob-based `ignores`, auto-mode branch detection via env/git, snippet-based baseline fingerprints (regenerate old baselines with `--update-baseline`).
- Rules: `no-unjustified-use-client`, `no-useless-memo`, and `no-demo-data-primary-path` hardened against false signals; shared static class extractor recovers classes from clsx/cn/cva-style calls; `require-reduced-motion` checks fallbacks locally with Tailwind variant awareness; threshold rules expose `maxGuards`/`maxRadiusPx`/`maxZIndex` options via `meta.schema`.
- Docs: `docs/rules/<rule>.md` for all 16 rules, linked via `meta.docs.url` and pinned by a test.
- Types: `.d.mts` declarations shipped for every package entry point (verified against a packed tarball with a node16 TS consumer).
- CI: Node 20/22/24 matrix + ESLint 9.0.0 floor job; release-triggered publish workflow uses npm trusted publishing (OIDC) with provenance via `pnpm publish` (requires trusted-publisher config on npmjs.com).
- QR capability gates are exposed through package scripts for formatting hygiene, JavaScript syntax validation, packaging, dead-code reachability, smoke verification, tests, and Pre-CR coverage.
- README install docs lead with the published npm package; local `file:` development lives in the Development section.

## Operating Notes

- `.quality-runner/` contains generated local audit artifacts and is ignored.
- `.planning/STATE.md` remains the detailed planning state file for session continuity.
- The plugin intentionally supports ESLint 9.x only.
- 2026-07-05: Completed 16-item review remediation (metadata, verify split, CLI globs/branch, fingerprints, rule correctness, class extractor, reduced-motion locality, rule options, docs pages, publish workflow, type declarations, CI matrix). `pnpm verify` passed after the full pass; ESLint 9.0.0 floor verified locally.

## QR Remediation Planning

- 2026-07-04: Added GSD Phase 4 for QR remediation from qr-fleet-continue-20260704-eslint-plugin-anti-slop; 2 plan(s) created from eslint-plugin-anti-slop.md. Execution has not started.
