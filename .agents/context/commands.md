---
id: eslint-plugin-anti-slop.commands
last_reviewed: 2026-07-28
---

# Commands

Use the pinned Corepack package manager:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm run coverage
corepack pnpm build
corepack pnpm package
corepack pnpm quality:contract
corepack pnpm secret:scan
corepack pnpm dependency:security:required
```

`corepack pnpm verify` is the deterministic local gate. `verify:ci` adds the
online published-consumer smoke and registry dependency audit. Run the focused
rule tests while iterating, then rerun the full gate before handoff.
