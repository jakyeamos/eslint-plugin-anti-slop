# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop`
- Package manager: `pnpm`
- Current release candidate: `0.2.0`
- Exported ESLint plugin metadata reports version `0.2.0`.
- Primary verification command: `pnpm verify`
- QR capability gates are exposed through package scripts for formatting hygiene, JavaScript syntax validation, packaging, dead-code reachability, smoke verification, tests, and Pre-CR coverage.
- README install docs now lead with the published npm package and keep local sibling-project development as a separate path.

## Operating Notes

- `.quality-runner/` contains generated local audit artifacts and is ignored.
- `.planning/STATE.md` remains the detailed planning state file for session continuity.
- The plugin intentionally supports ESLint 9.x only.
- 2026-07-04: `pnpm verify` passed after the README install documentation update.
