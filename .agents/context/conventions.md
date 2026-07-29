---
id: eslint-plugin-anti-slop.conventions
last_reviewed: 2026-07-28
---

# Coding conventions

- Keep runtime modules ESM and use explicit `node:` imports.
- Preserve stable public exports, rule IDs, schemas, and formatter output.
- Add `RuleTester` valid, invalid, and false-positive cases before changing a
  rule heuristic.
- Prefer a focused shared helper only when three or more rules need it.
- Keep generated audit and coverage output out of Git.
- Keep TypeScript declaration and consumer checks strict; do not paper over
  public API type errors with broad casts or weakened compiler settings.
