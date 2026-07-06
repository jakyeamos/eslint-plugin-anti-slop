# anti-slop/no-useless-memo

Discourage trivial `useMemo`/`useCallback` usage.

## Why

Memoizing a constant or wrapping a one-line callback adds indirection and dependency-array maintenance without measurable benefit. It is a common tell of generated code optimizing nothing.

## Detection

The rule resolves the callee through scope analysis, so it only fires for:

- `useMemo`/`useCallback` imported from `react` (aliases included),
- `React.useMemo`/`React.useCallback` through a react namespace or default import,
- unresolved globals named `useMemo`/`useCallback`/`React`.

Local functions named `useMemo` or imports from other modules (for example `proxy-memoize`) are ignored.

`useMemo` is flagged when the factory returns a trivial expression (literal, template literal, identifier, member access, or binary expression). `useCallback` is flagged when the callback has no statements other than a single return.

## Examples

Invalid:

```tsx
import { useMemo, useCallback } from "react";

const value = useMemo(() => 1, []);
const onClick = useCallback(() => submit(), []);
```

Valid:

```tsx
import { useMemo } from "react";

const filtered = useMemo(() => items.filter((item) => item.active), [items]);
const summary = useMemo(() => ({ total: items.length, items }), [items]);
```

## Options

None.

## When not to use it

If a trivial memo is load-bearing because the value feeds a reference-sensitive dependency array or `React.memo` child, suppress the finding locally with an explanatory comment instead of disabling the rule.
