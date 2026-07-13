# anti-slop/require-empty-state-action

Require empty states to include an actionable next step.

## Why

An empty state that only says "No invoices" strands the user. Good empty states say what to do next.

## Detection

The rule checks high-confidence empty-state language such as `No invoices`, `Nothing found`, `0 results`, `Not found`, or `Empty`. Generic prose such as `No action required.` is not an empty state.

The same static render path in the nearest local message/container boundary must include either configured action wording (`settings["anti-slop"].actionWords`, default: `retry`, `open`, `create`, `run`, `fix`, `clear filter`) or a usable control. An action in a mutually exclusive branch or elsewhere on the page does not satisfy the message.

Usable controls are enabled buttons; anchors with a non-empty `href` or a callable `onClick` handler; enabled, non-hidden `input`, `select`, or `textarea` controls; and other visible elements with a callable `onClick` handler. Disabled controls, href-less anchors without a handler, hidden inputs, controls inside a hidden ancestor, and native form controls inside a disabled `fieldset` do not count, except controls in that fieldset's first `legend`. Native boolean attributes use HTML semantics, so `disabled="false"` and `hidden="false"` still make a control unavailable; `disabled` does not disable an anchor or a generic element.

## Examples

Invalid:

```tsx
export function InvoiceList() {
  return (
    <section>
      <div className="empty-state"><p>No invoices</p></div>
      <footer><button>Create invoice</button></footer>
    </section>
  );
}
```

```tsx
<section><p>No invoices</p><button disabled>Retry</button></section>
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
