# eslint-plugin-anti-slop

## What This Is

Local ESLint plugin that exposes config-driven rules to block high-confidence UI and code slop in React and TypeScript projects. The implementation and README exist, but the repo did not yet have git or planning state to support structured iteration.

## Core Value

Teams should be able to enforce anti-slop rules directly in ESLint with a simple, local integration path.

## Requirements

### Validated

- ✓ The repo already exports plugin rules and a flat-config usage example.
- ✓ The package already documents local-path installation and the current rule set.

### Active

- [ ] Establish repository and planning baseline so the plugin can evolve intentionally.
- [ ] Verify the plugin loads cleanly in local consumer projects.
- [ ] Define the next rule-hardening and packaging steps.

### Out of Scope

- Growing the rule catalog without validating the current rules in real consumers - The plugin should harden its current promise first.
- Publishing automation before repo basics are in place - The repo needed git and planning state before broader release work.

## Context

- The plugin is already used as a local file dependency from sibling projects such as portfolio.
- Before this session the folder did not even have a git repository initialized.
- The README is concise and focused on the current rules and usage pattern.

## Constraints

- **Consumer compatibility**: Rules need to work in modern ESLint flat-config projects - That is how the plugin is currently documented.
- **Local dependency workflow**: The plugin should stay usable as a sibling file dependency during development - Current consumers already depend on that setup.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bootstrap GSD planning in an existing brownfield repo | The repo needed planning state before phase work could be managed coherently | - Pending |

---
*Last updated: 2026-04-10 after initial GSD bootstrap*
