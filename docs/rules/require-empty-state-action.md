# anti-slop/require-empty-state-action

Require empty states to include an actionable control or action wording.

## Why

An empty state that only says "No invoices" strands the user. Good empty states say what to do next.

## Detection

JSX blocks whose combined text looks like an empty state must contain either an actionable element (`button`, `a`, `input`, `select`, `textarea`, or anything with `onClick`) or wording from `settings["anti-slop"].actionWords` (default: `retry`, `open`, `create`, `run`, `fix`, `clear filter`).

## Examples

Invalid:

```tsx
export function InvoiceList() {
  return (
    <section>
      <p>No invoices</p>
    </section>
  );
}
```

Valid:

```tsx
export function InvoiceList() {
  return (
    <section>
      <p>No invoices</p>
      <button>Create invoice</button>
    </section>
  );
}
```

## Options

None. Configure wording through `settings["anti-slop"].actionWords`.
