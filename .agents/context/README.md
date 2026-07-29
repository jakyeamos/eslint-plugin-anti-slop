# eslint-plugin-anti-slop context index

last_reviewed: 2026-08-11

Load only the packet needed for the task. This repository is an ESLint plugin;
rule behavior, fixtures, packaging, and consumer compatibility are separate
surfaces. Read `AGENTS.md` first, then load only the packet matching the task.
These packets are intentionally short and pointer-based.

- [README.md](../../README.md) — plugin contract, rule usage, and verification.
- [AGENTS.md](../../AGENTS.md) — implementation and safety boundaries.
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — test, release, and fixture expectations.

| Task | Packet |
| --- | --- |
| package boundaries and exports | [architecture.md](architecture.md) |
| commands and verification | [commands.md](commands.md) |
| rule and JavaScript conventions | [conventions.md](conventions.md) |
| credentials and network behavior | [security.md](security.md) |
| recurring failures | [failure-modes.md](failure-modes.md) |
| representative implementations | [examples.md](examples.md) |
| acceptance and definition of done | [done.md](done.md) |
| packaging, publishing, and rollback | [deployment.md](deployment.md) |

Use `pnpm verify` for the deterministic local gate. Registry-backed consumer
and release checks remain separate external evidence. Do not dump the
repository into a prompt; start with this index and one packet, then use
commands and tests to discover the rest.
