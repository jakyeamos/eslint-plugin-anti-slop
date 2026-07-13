# anti-slop/no-unjustified-use-client

Prevent unnecessary `"use client"` directives.

## Why

Every unjustified `"use client"` moves a component (and everything it imports) out of the server bundle, growing client JavaScript and losing server-only capabilities for no benefit. Generated code frequently adds the directive defensively.

## What counts as a client signal

- A React client hook (`useState`, `useEffect`, `useRef`, ...) imported from `react` and actually referenced in the file (aliased imports are tracked by their local name; an unused import is not a signal).
- A referenced conventional hook import whose local binding matches `use[A-Z]`, such as `useWorkspace` from an application hook module. Type-only imports and type-only references do not count.
- `React.useState(...)`-style member access through a react namespace or default import.
- Unshadowed browser globals: `window`, `document`, `localStorage`, `sessionStorage`, and `navigator`, including access through `globalThis` such as `globalThis["localStorage"]`. Object-property spellings such as `settings.window` do not count.
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

import { useWorkspace } from "./use-workspace";

export function Header() {
  const workspace = useWorkspace();
  return <header>{workspace.name}</header>;
}
```

## Options

None. Configure client-only modules through `settings["anti-slop"].clientOnlyImports`.

## When not to use it

If your project intentionally marks entire directories as client components regardless of content, disable this rule for those paths.

## Fixer

This rule reports for manual review and deliberately has no autofix. A file-local heuristic cannot prove that removing the directive preserves the server/client boundary.
