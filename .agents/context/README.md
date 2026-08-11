# eslint-plugin-anti-slop context index

last_reviewed: 2026-08-11

Load only the packet needed for the task. This repository is an ESLint plugin;
rule behavior, fixtures, packaging, and consumer compatibility are separate
surfaces.

- [README.md](../../README.md) — plugin contract, rule usage, and verification.
- [AGENTS.md](../../AGENTS.md) — implementation and safety boundaries.
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — test, release, and fixture expectations.

Use `pnpm verify` for the deterministic local gate. Registry-backed consumer
and release checks remain separate external evidence.
