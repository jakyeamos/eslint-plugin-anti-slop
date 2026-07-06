# anti-slop/no-unjustified-use-client

Prevent unnecessary `"use client"` directives.

## Why

Every unjustified `"use client"` moves a component (and everything it imports) out of the server bundle, growing client JavaScript and losing server-only capabilities for no benefit. Generated code frequently adds the directive defensively.

## What counts as a client signal

- A React client hook (`useState`, `useEffect`, `useRef`, ...) imported from `react` and actually referenced in the file (aliased imports are tracked by their local name; an unused import is not a signal).
- `React.useState(...)`-style member access through a react namespace or default import.
- Browser globals: `window`, `document`, `localStorage`, `sessionStorage`, `navigator`.
- JSX event handler props matching `/^on[A-Z]/` (`onClick`, `onChange`; a prop like `online` does not count).
- Imports from configured client-only modules (`settings["anti-slop"].clientOnlyImports`, default: `next/navigation`, `@tanstack/react-query`, `recharts`).

## Examples

Invalid:

```tsx
"use client";

export function Header() {
  return <header>Account</header>;
}
```

Valid:

```tsx
"use client";

import * as React from "react";

export function Toggle() {
  const [open, setOpen] = React.useState(false);
  return <button onClick={() => setOpen(!open)}>Toggle</button>;
}
```

## Options

None. Configure client-only modules through `settings["anti-slop"].clientOnlyImports`.

## When not to use it

If your project intentionally marks entire directories as client components regardless of content, disable this rule for those paths.

## Fixer

The rule autofixes by removing the directive and its trailing newline.
