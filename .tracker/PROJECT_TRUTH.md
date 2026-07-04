# Project Truth

## Current State

- Package: `eslint-plugin-anti-slop`
- Package manager: `pnpm`
- Current release candidate: `0.2.0`
- Exported ESLint plugin metadata reports version `0.2.0`.
- Primary verification command: `pnpm verify`
- QR capability gates are exposed through package scripts for formatting hygiene, JavaScript syntax validation, packaging, dead-code reachability, smoke verification, tests, and Pre-CR coverage.

## Operating Notes

- `.quality-runner/` contains generated local audit artifacts and is not committed.
- `.planning/STATE.md` remains the detailed planning state file for session continuity.
- The plugin intentionally supports ESLint 9.x only.
