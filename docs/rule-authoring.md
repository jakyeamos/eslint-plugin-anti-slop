# Rule Authoring

Use this guide when adding or changing an ESLint rule in this package.

## Start With Behavior

Write the smallest `RuleTester` fixture that describes the expected behavior before editing production code.

Good fixtures should answer:

- What should be reported?
- What should not be reported?
- Which message id should fire?
- Is the fixer expected to change output?

## Fixture Shape

Use realistic examples:

```tsx
export function EmptyState() {
  return (
    <section>
      <p>No invoices</p>
      <button>Create invoice</button>
    </section>
  );
}
```

Prefer realistic component code over isolated expressions when parent/child AST context matters.

## False Positives

For heuristic rules, valid fixtures are as important as invalid fixtures. Add a valid fixture for each known acceptable pattern near the behavior being changed.

Examples:

- `React.useState` and `React["useState"]` should justify `"use client"`.
- Object literals returned from `useMemo` may be legitimate when they package derived data.
- Empty-state child text should not report separately when the parent block contains an action.

## Metadata

Each rule should expose:

- `meta.type`
- `meta.docs.description`
- `meta.schema`
- stable `meta.messages` ids
- `meta.fixable` only when a fixer is implemented

## Presets

When adding a rule, add one entry to `src/internal/rules/catalog.mjs` with its
rule name, rule module, and metadata:

- category
- `recommendedSeverity` for balanced product defaults
- `strictSeverity` for all-error enforcement
- `evidenceSeverity` for opt-in evidence-preservation rules
- `requiredFix` guidance

The catalog derives plugin registration, rule documentation URLs, both presets,
the public metadata facade, and SARIF rule records. Do not add a second manual
registration or metadata table elsewhere.

Then update `README.md`, `CHANGELOG.md`, and tests that assert preset exports.
