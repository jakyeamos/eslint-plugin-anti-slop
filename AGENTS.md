# Repository Agent Instructions

## Scope

These instructions apply to this repository.

## Package Management

- Use `pnpm` only. Do not use `npm` or `yarn`.
- Install dependencies with `pnpm install`.
- Run scripts with `pnpm <script>`.

## Rule Changes

- Read the existing rule and tests before editing.
- Add or update `RuleTester` cases before changing rule behavior.
- Cover both valid and invalid examples for every behavior change.
- Add false-positive fixtures when tightening or broadening a heuristic.
- Keep rule fixes scoped; do not add new abstractions unless three or more rules clearly need the same helper.

## Product Surface

- Update `README.md` when rule names, presets, config keys, examples, or release flow change.
- Update `CHANGELOG.md` for user-visible behavior, packaging, or documentation changes.
- Update `.planning/STATE.md` after completed work that changes the repo's actual state.

## Verification

Run this before committing product or rule changes:

```bash
pnpm verify
```

For small documentation-only changes, run at least:

```bash
pre-cr run --workspace .
```

## Commits

- Keep commits atomic and scoped to one concern.
- Do not bypass hooks with `--no-verify`.
- Commit the project truth-file update separately after the implementation commit when work changes project state.
