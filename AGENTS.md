# Repository Agent Instructions

## Scope

These instructions apply to this repository. Read `.agents/context/README.md`
first and load only the packet relevant to the task.

## Ownership and boundaries

- `src/` owns the published ESLint plugin, rules, CLI, gate, and audit
  projections.
- `test/` owns behavioral and public-contract evidence; `smoke-consumer/` owns
  real-consumer compatibility evidence.
- `scripts/` owns deterministic repository checks and never replaces Quality
  Runner's findings engine.
- AIOS is historical compatibility only. Do not import AIOS modules, write to
  its database, or inherit its permissions.
- Quality Runner owns repository quality findings; this package only exposes
  its own rule and audit behavior.

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

The environment contract is an additional blocking prerequisite:

```bash
pnpm quality:contract
pre-cr run --workspace .
```

Keep `test/types/tsconfig.json` strict. Do not weaken type or security checks
to make a branch green. Distinguish deterministic local evidence from
registry-dependent consumer and dependency evidence.

For small documentation-only changes, run at least:

```bash
pre-cr run --workspace .
```

## Commits

- Keep commits atomic and scoped to one concern.
- Do not bypass hooks with `--no-verify`.
- Keep optional planning notes separate from implementation commits when a
  change materially affects documented scope; no status-file update is
  required for completion.

## Definition of done

A change is complete only when its implementation, rule catalog, docs, fixtures,
package contents, and verification evidence agree. Publishing, marketplace
release, remotes, and deployment remain explicit human-approved actions.
