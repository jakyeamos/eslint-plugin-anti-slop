# eslint-plugin-anti-slop

Config-driven ESLint rules that catch high-confidence UI and code quality problems in React and TypeScript products.

The plugin is intentionally opinionated. It focuses on issues that make product interfaces feel unfinished: unjustified client components, placeholder text, generic marketing copy, demo data in primary routes, weak empty states, generic stat labels, and low-value memoization.

## Install

For local sibling-project development:

```bash
pnpm add -D file:/Users/jakyeamos/projects/eslint-plugin-anti-slop
```

For registry usage after publishing:

```bash
pnpm add -D eslint-plugin-anti-slop
```

## Quick Start

```javascript
// eslint.config.mjs
import antiSlop from "eslint-plugin-anti-slop";

export default [
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ...antiSlop.configs.recommended,
  },
];
```

## Custom Configuration

Rules read project-specific vocabulary from `settings["anti-slop"]`.

```javascript
// eslint.config.mjs
import antiSlop from "eslint-plugin-anti-slop";

export default [
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    plugins: {
      "anti-slop": antiSlop,
    },
    settings: {
      "anti-slop": {
        placeholderPatterns: ["coming soon", "todo", "tbd", "lorem ipsum", "placeholder"],
        marketingPatterns: ["powerful", "seamless", "unlock", "supercharge"],
        genericStatLabels: ["performance", "insights", "overview", "analytics", "usage", "activity"],
        actionWords: ["retry", "open", "create", "run", "fix", "clear filter"],
        demoDataModules: ["@/demo", "@/mocks", "@/fixtures"],
        realDataIndicators: ["fetch", "db", "prisma", "trpc"],
        clientOnlyImports: ["next/navigation", "@tanstack/react-query", "recharts"],
      },
    },
    rules: {
      "anti-slop/no-unjustified-use-client": "error",
      "anti-slop/no-useless-memo": "warn",
      "anti-slop/no-placeholder-copy": "error",
      "anti-slop/no-marketing-copy": "warn",
      "anti-slop/require-empty-state-action": "warn",
      "anti-slop/no-demo-data-primary-path": "error",
      "anti-slop/no-generic-stat-label": "warn",
    },
  },
];
```

## Presets

- `antiSlop.configs.recommended`: balanced defaults for product repositories.
- `antiSlop.configs.strict`: escalates every rule to `error`.

## Rules

### `anti-slop/no-unjustified-use-client`

Removes unnecessary `"use client"` directives when the file has no obvious client-only behavior.

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

### `anti-slop/no-useless-memo`

Flags trivial `useMemo` and `useCallback` calls that add indirection without a clear memo-sensitive reason.

Invalid:

```tsx
const value = useMemo(() => 1, []);
const onClick = useCallback(() => submit(), []);
```

Valid:

```tsx
const filtered = useMemo(() => items.filter((item) => item.active), [items]);
const summary = useMemo(() => ({ total: items.length, items }), [items]);
```

### `anti-slop/no-placeholder-copy`

Blocks placeholder text in user-facing JSX and common copy-bearing object properties.

Invalid:

```tsx
export function EmptyState() {
  return <p>Coming soon</p>;
}
```

Valid:

```tsx
const internalNote = "todo";
```

### `anti-slop/no-marketing-copy`

Discourages generic marketing language inside product UI.

Invalid:

```tsx
export function Banner() {
  return <p>Unlock powerful insights</p>;
}
```

Valid:

```tsx
export function Banner() {
  return <p>Run payroll for contractors</p>;
}
```

### `anti-slop/require-empty-state-action`

Requires empty states to include either an actionable control or action wording in the same UI block.

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

### `anti-slop/no-demo-data-primary-path`

Prevents primary route files from importing demo data without a clear real-data indicator.

Invalid:

```tsx
import { rows } from "@/fixtures/rows";

export function Page() {
  return rows;
}
```

Valid:

```tsx
import { rows } from "@/fixtures/rows";

export async function Page() {
  const data = await fetch("/api/rows");
  return data;
}
```

### `anti-slop/no-generic-stat-label`

Discourages vague metric and section labels.

Invalid:

```tsx
export function Dashboard() {
  return <h2>Analytics</h2>;
}
```

Valid:

```tsx
export function Dashboard() {
  return <h2>Failed payments</h2>;
}
```

## Development

```bash
pnpm install
pnpm test
```

Tests use ESLint `RuleTester` through Node's built-in test runner.

## Release Checklist

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm test`.
3. Update `CHANGELOG.md`.
4. Confirm `package.json` version and package metadata.
5. Publish with `pnpm publish` when ready.
