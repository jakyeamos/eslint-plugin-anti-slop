# anti-slop/no-widen-then-assert

Discourage immutable local values that are widened before being asserted back to
a narrower structural type.

## Why

The widen-then-assert sequence erases evidence and recreates confidence later
without adding validation. Boundary input should be parsed or validated once,
then carried through the function with its precise type.

## Detection

The rule tracks stable `const` bindings whose known initializer flows into
`unknown`, `any`, `object`, or an open dictionary. It reports a later assertion
of that same binding to a narrower object or record shape in the same function
or module boundary.

Unknown values without a known initializer, reassigned bindings, and assertions
that remain broad are ignored.

## Examples

Invalid:

```ts
const source = { id: "user-1" };
const widened: unknown = source;
const user = widened as { readonly id: string };
```

Valid:

```ts
declare const input: unknown;
const user = input as { readonly id: string };
```

## Options

None.

## When not to use it

If an assertion follows a real parser or validator but the parser result is
temporarily stored in a broad type for an integration boundary, suppress the
finding locally and explain that boundary in a `SAFETY:` comment.
