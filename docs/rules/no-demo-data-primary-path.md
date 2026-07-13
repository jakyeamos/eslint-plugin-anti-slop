# anti-slop/no-demo-data-primary-path

Prevent primary routes from relying on demo data as the primary data source.

## Why

Demo/fixture data on a real route makes an app look done while doing nothing. It belongs in previews, stories, and tests — not the main path.

## Detection

Applies to primary route files: `app/page.tsx` (including the root route and `src/app/**`), `app/**/layout.*`, `app/**/route.*`, and `pages/**` / `src/pages/**` modules.

A runtime binding imported from a configured demo module (`settings["anti-slop"].demoDataModules`, default: `@/demo`, `@/mocks`, `@/fixtures`) is allowed only as the right-hand side of `??` when its left-hand side is a configured real-data call (`fetch(...)`, `db.report.findMany()`, `trpc.rows.list.useQuery()`) or that call's immutable `const` direct result in the same lexical scope. Type-only imports and type-only references are not runtime fixture use.

An unrelated real-data call, a data-layer import, another fixture binding, direct fixture use, and `||` do not make fixture data safe. Unused fixture bindings are not a primary-path use, while side-effect fixture imports are reported.

Transparent TypeScript value wrappers such as `as Rows`, `rows!`, and `rows satisfies Rows` do not change whether a runtime fixture reference is a permitted fallback or a primary-path use.

## Examples

Invalid:

```tsx
// app/page.tsx
import { rows } from "@/fixtures/rows";
import { db } from "@/lib/db";

export async function Page() {
  const records = await db.report.findMany();
  return records || rows;
}
```

Valid:

```tsx
// app/page.tsx
import { rows } from "@/fixtures/rows";
import { db } from "@/lib/db";

export async function Page() {
  const records = await db.report.findMany();
  return records ?? rows;
}
```

## Options

None. Configure module lists through `settings["anti-slop"].demoDataModules` and `settings["anti-slop"].realDataIndicators`.
