# eslint-plugin-anti-slop

Config-driven ESLint rules that catch high-confidence UI and code quality problems in React and TypeScript products.

The plugin is intentionally opinionated. It focuses on issues that make product interfaces feel unfinished or codebases feel vibe-coded: unjustified client components, placeholder text, generic marketing copy, demo data in primary routes, weak empty states, generic stat labels, defensive guard sprawl, and low-value memoization.

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
      "anti-slop/no-defensive-guard-sprawl": "warn",
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

### `anti-slop/no-defensive-guard-sprawl`

Flags ordinary functions that stack more than two leading nullish or `isRecord(...)` guards. Centralized validators and type guards such as `isRecord`, `assertPayload`, `ensurePayload`, and `validatePayload` are allowed to own repeated shape checks.

Invalid:

```ts
function parseUser(input) {
  if (!isRecord(input)) return null;
  if (input.id == null) return null;
  if (input.email == null) return null;

  return { id: input.id, email: input.email };
}
```

Valid:

```ts
function assertUserPayload(input) {
  if (!isRecord(input)) throw new Error("Invalid user");
  if (input.id == null) throw new Error("Invalid user");
  if (input.email == null) throw new Error("Invalid user");
}
```

## Development

```bash
pnpm install
pnpm test
pnpm test:coverage
pnpm smoke:consumer
pnpm verify
```

Rule tests use ESLint `RuleTester` through Node's built-in test runner. `pnpm
test:coverage` writes source LCOV to `coverage/lcov.info` for the repo's Pre-CR
coverage gate.

`pnpm verify` is the local pre-PR gate and the CI gate. It runs the RuleTester
suite, coverage, the smoke consumer, Pre-CR changed-line readiness, and an npm
tarball smoke pack.

`pnpm smoke:consumer` installs `eslint-plugin-anti-slop` into `smoke-consumer/`
as a local `file:..` dependency with pnpm, then runs ESLint against a small JSX
fixture. Use it when you need to confirm the package works from a real consumer
project instead of only through direct source imports.

## Quality Gate CLI

The package includes a gate runner for CI, local hooks, and Pre-CR-adjacent checks:

```bash
pnpm exec anti-slop check .
pnpm exec anti-slop gate --changed --mode block --format pre-cr
```

`anti-slop check` defaults to human-readable output. `anti-slop gate` defaults to
line-delimited Pre-CR-compatible records. Both commands run ESLint with a
built-in Anti-Slop flat config, normalize `anti-slop/*` findings, apply the
configured gate policy, and exit nonzero only when the effective policy blocks
new error findings. The built-in config supports JavaScript, JSX, TypeScript,
and TSX, so backfill scans can run before a target repo has adopted an
Anti-Slop ESLint config.

Gate policy modes:

- `--mode auto`: block on protected branches or known dev/production gate envs,
  warn on detected feature branches.
- `--mode block`: fail the process when new error findings exist.
- `--mode warn`: report findings without failing the process.
- `--mode audit`: always exit zero while still emitting findings.

Output formats:

- `text`: concise terminal summary.
- `json`: full report with summary, new findings, and baselined findings.
- `jsonl`: one machine-readable finding per line.
- `pre-cr`: JSONL records shaped for quality-gate ingestion.
- `sarif`: SARIF 2.1.0 for CI code-scanning systems.

Optional `anti-slop.config.json`:

```json
{
  "files": ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
  "ignores": ["dist/**"],
  "mode": "auto",
  "baselinePath": ".anti-slop-baseline.json",
  "outputPath": ".aios/audit/anti-slop.json"
}
```

Use changed-file mode for fast local gates:

```bash
pnpm exec anti-slop gate --changed --mode block --format pre-cr
```

Use audit mode for first-pass repo adoption/backfill evidence:

```bash
pnpm exec anti-slop check . --mode audit --format json
```

Use a baseline to adopt the gate in existing codebases without blocking on
known findings:

```bash
pnpm exec anti-slop check . --update-baseline
pnpm exec anti-slop gate . --baseline .anti-slop-baseline.json --mode block
```

For Pre-CR, keep Anti-Slop as a separate quality command alongside
`pre-cr run --workspace .` until Pre-CR grows a first-class external-gate
adapter:

```json
{
  "scripts": {
    "quality:anti-slop": "anti-slop gate --changed --mode block --format pre-cr",
    "quality": "pnpm quality:anti-slop && pre-cr run --workspace ."
  }
}
```

## Gate Audit Output

Anti-Slop ESLint runners can emit AIOS-compatible audit artifacts with the package formatter:

```bash
pnpm exec eslint . --format eslint-plugin-anti-slop/audit-formatter
```

The formatter records branch-aware `anti-slop/*` findings in `.aios/audit/gate-events.jsonl` and refreshes `.aios/audit/gate-summary.md` plus `.aios/audit/learning-lessons.md`. Findings are recorded as blocks on `main`, `master`, `dev`, `develop`, `development`, or when `AIOS_DEV_ENVIRONMENT`, `AIOS_DEV_ENV`, `QUALITY_GATE_DEV_ENV`, or `GATE_CONNECTED_DEV_ENV` is set; detected unprotected feature branches are recorded as warnings. ESLint process exit behavior still depends on the runner's rule severity and CLI settings.

## Release Checklist

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm verify`.
3. Update `CHANGELOG.md`.
4. Confirm `package.json` version and package metadata.
5. Publish with `pnpm publish` when ready.
