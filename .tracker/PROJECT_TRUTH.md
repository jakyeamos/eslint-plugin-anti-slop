# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop`
- Current released version: `0.3.0` (`v0.3.0` tag); not an unreleased `0.2.0` candidate.
- Package manager: `pnpm`
- Modernization status: audit, target architecture, and vertical execution plan committed on `codex/gpt56-modernization-audit`; implementation has not started.
- Plugin metadata is derived from `package.json` at load time and declares `namespace: "anti-slop"`.
- Primary verification command: `pnpm verify` (reproducible, no global tools); `pnpm verify:local` adds Pre-CR readiness for machines with the global `pre-cr`.
- Runtime dependencies: `@typescript-eslint/parser`, `picomatch` (CLI glob ignores).
- CLI: glob-based `ignores`, auto-mode branch detection via env/git, snippet-based baseline fingerprints (regenerate old baselines with `--update-baseline`).
- Rules: `no-unjustified-use-client`, `no-useless-memo`, and `no-demo-data-primary-path` hardened against false signals; shared static class extractor recovers classes from clsx/cn/cva-style calls; `require-reduced-motion` checks fallbacks locally with Tailwind variant awareness; threshold rules expose `maxGuards`/`maxRadiusPx`/`maxZIndex` options via `meta.schema`.
- Docs: `docs/rules/<rule>.md` for all 16 rules, linked via `meta.docs.url` and pinned by a test.
- Types: `.d.mts` declarations ship for every package entry point; compiler validation of the packed type surface is planned in modernization M0.
- CI: Node 20/22/24 matrix + ESLint 9.0.0 floor job; release-triggered publish workflow uses npm trusted publishing (OIDC) with provenance via `pnpm publish` (requires trusted-publisher config on npmjs.com).
- Baseline quality checks all pass: `pnpm verify`, build, syntax, format, dead-code, secret scan, and dependency security.
- `pnpm verify`/CI currently omit some defined quality/security checks; M1 will establish the authoritative deterministic and supply-chain release gates.
- README install docs lead with the published npm package; local `file:` development lives in the Development section.

## Operating Notes

- `.quality-runner/` contains generated local audit artifacts and is ignored.
- `.planning/STATE.md` remains the detailed planning state file for session continuity.
- The plugin intentionally supports ESLint 9.x only.
- `dependency:security` fails on real high/critical advisories but intentionally exits zero when registry audit data is unavailable; release policy needs to make that distinction explicit.
- User-owned untracked `.agents/` and `skills/` directories are outside the tracked product surface and were not changed by the audit branch.

## QR Remediation Planning

- 2026-07-04: Added GSD Phase 4 for QR remediation from qr-fleet-continue-20260704-eslint-plugin-anti-slop; 2 plan(s) exist but have not started.
- 2026-07-10: `docs/modernization/` is the current approved-for-review route for contract, gate, rule-confidence, and release hardening. Reconcile it with QR Phase 4 before parallel execution.
