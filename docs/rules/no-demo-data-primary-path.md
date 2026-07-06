# anti-slop/no-demo-data-primary-path

Prevent primary routes from relying on demo data as the primary data source.

## Why

Demo/fixture data on a real route makes an app look done while doing nothing. It belongs in previews, stories, and tests — not the main path.

## Detection

Applies to primary route files: `app/page.tsx` (including the root route and `src/app/**`), `app/**/layout.*`, `app/**/route.*`, and `pages/**` / `src/pages/**` modules.

A file is flagged when it imports from a configured demo module (`settings["anti-slop"].demoDataModules`, default: `@/demo`, `@/mocks`, `@/fixtures`) without real-data evidence. Evidence means an actual call whose root is a configured indicator (`fetch(...)`, `db.report.findMany()`, `trpc.rows.list.useQuery()`) or an import whose path contains an indicator segment (`@/lib/db`). Unrelated identifiers — such as an object key named `fetch` — do not count.

## Examples

Invalid:

```tsx
// app/page.tsx
import { rows } from "@/fixtures/rows";

export function Page() {
  return rows;
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
