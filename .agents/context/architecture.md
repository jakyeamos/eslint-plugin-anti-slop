---
id: eslint-plugin-anti-slop.architecture
last_reviewed: 2026-07-28
---

# Architecture and boundaries

- `src/index.mjs` is the public plugin export and rule preset surface.
- `src/rules/` contains individual ESLint rules and shared rule helpers.
- `src/gate.mjs` and `src/cli.mjs` own the gate and CLI behavior.
- `src/audit.mjs` and formatter modules own append-only audit projections.
- `src/internal/rules/catalog.mjs` is the canonical rule metadata catalog.
- `test/` is the behavioral and public-contract corpus; `smoke-consumer/`
  verifies a real consumer surface.
- `scripts/` owns deterministic repository checks, not runtime plugin logic.

Quality Runner owns repository quality findings. AIOS is historical compatibility
only and must not become a runtime dependency or data store.
