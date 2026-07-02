# eslint-plugin-anti-slop

<p align="center"><strong>Config-driven ESLint rules for high-confidence React and TypeScript product-quality problems.</strong></p>

<p align="center">
  <img alt="Status: active ESLint plugin" src="https://img.shields.io/badge/status-active%20ESLint%20plugin-0f766e">
  <img alt="ESLint: 9" src="https://img.shields.io/badge/ESLint-9.x-4b32c3">
  <img alt="Node: 20+" src="https://img.shields.io/badge/Node-20%2B-339933">
  <img alt="Package manager: pnpm" src="https://img.shields.io/badge/package%20manager-pnpm-f59e0b">
</p>

`eslint-plugin-anti-slop` catches product and UI code patterns that make React/TypeScript apps feel unfinished: unjustified client components, placeholder copy, generic marketing text, demo data on primary routes, weak empty states, generic stat labels, defensive guard sprawl, low-value memoization, and deterministic structural UI tells such as gradient text, decorative grid backgrounds, side-stripe accents, excessive radii, arbitrary z-index values, missing reduced-motion fallbacks, hidden reveal defaults, and nested cards.

The plugin is intentionally opinionated. It focuses on rules that are specific enough to be useful in product repositories without turning lint into vague taste enforcement.

## Compatibility

- Node.js 20 or newer.
- ESLint 9.x with flat config.
- React/TypeScript projects using app, component, or library source paths.

ESLint 8 is not supported. A local compatibility audit showed that ESLint
8.57.1 can load the flat-config rule preset in a narrow lint smoke, but the
package CLI fails under ESLint 8 because that major rejects the ESLint 9
`overrideConfigFile: true` option used by `anti-slop check` and
`anti-slop gate`. Consumers should upgrade to ESLint 9 before adopting the
plugin or CLI.

## Install

Local sibling-project development:

```bash
pnpm add -D file:/Users/jakyeamos/projects/eslint-plugin-anti-slop
```

Registry usage after publishing:

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
      "anti-slop/no-gradient-text": "warn",
      "anti-slop/no-decorative-grid-background": "warn",
      "anti-slop/no-side-stripe-accent": "warn",
      "anti-slop/no-excessive-radius": "warn",
      "anti-slop/no-arbitrary-z-index": "warn",
      "anti-slop/require-reduced-motion": "warn",
      "anti-slop/no-hidden-reveal-default": "warn",
      "anti-slop/no-nested-cards": "warn",
    },
  },
];
```

## Presets

| Preset | Purpose |
| --- | --- |
| `antiSlop.configs.recommended` | Balanced defaults for product repositories. |
| `antiSlop.configs.strict` | Escalates every rule to `error`. |

## Rules

| Rule | What it catches |
| --- | --- |
| `anti-slop/no-unjustified-use-client` | Client components without obvious client-only behavior. |
| `anti-slop/no-useless-memo` | Trivial `useMemo` and `useCallback` calls. |
| `anti-slop/no-placeholder-copy` | Placeholder text in user-facing JSX and copy-bearing objects. |
| `anti-slop/no-marketing-copy` | Generic product marketing language inside application UI. |
| `anti-slop/require-empty-state-action` | Empty states with no action or action wording. |
| `anti-slop/no-demo-data-primary-path` | Primary route files importing demo or fixture data without real-data indicators. |
| `anti-slop/no-defensive-guard-sprawl` | Repeated low-signal defensive checks that obscure the real contract. |
| `anti-slop/no-generic-stat-label` | Dashboard labels such as "insights" or "performance" without domain meaning. |
| `anti-slop/no-gradient-text` | Gradient-clipped text in static JSX class names or style objects. |
| `anti-slop/no-decorative-grid-background` | Decorative two-axis one-pixel CSS gradient backgrounds. |
| `anti-slop/no-side-stripe-accent` | Thick left/right border stripe accents on cards and callouts. |
| `anti-slop/no-excessive-radius` | Oversized static radius values on framed UI surfaces. |
| `anti-slop/no-arbitrary-z-index` | Arbitrary z-index values outside a semantic stacking scale. |
| `anti-slop/require-reduced-motion` | Static motion code without a reduced-motion fallback. |
| `anti-slop/no-hidden-reveal-default` | Reveal patterns that hide content by default. |
| `anti-slop/no-nested-cards` | Nested `Card` components or nested `card` class containers. |

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

### `anti-slop/no-gradient-text`

Discourages gradient-clipped text from static JSX class names and style objects.

Invalid:

```tsx
<h1 className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
  Revenue
</h1>
```

Valid:

```tsx
<h1 className="text-brand">Revenue</h1>
```

### `anti-slop/no-decorative-grid-background`

Flags two-axis one-pixel CSS gradient backgrounds used as decoration.

Invalid:

```tsx
<div style={{ backgroundImage: "linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)" }} />
```

Valid:

```tsx
<div className="grid grid-cols-2 gap-4" />
```

### `anti-slop/no-side-stripe-accent`

Flags thick left/right border accents such as `border-l-4` or `borderLeftWidth: 6`.

Invalid:

```tsx
<aside className="border-l-4 border-red-500" />
```

Valid:

```tsx
<aside className="border border-red-200 bg-red-50" />
```

### `anti-slop/no-excessive-radius`

Flags static radius values of 32px or larger on framed surfaces.

Invalid:

```tsx
<section className="rounded-[40px]" />
```

Valid:

```tsx
<section className="rounded-xl" />
```

### `anti-slop/no-arbitrary-z-index`

Flags arbitrary z-index values of 999 or higher.

Invalid:

```tsx
<div className="z-[9999]" />
```

Valid:

```tsx
<div className="z-50" />
```

### `anti-slop/require-reduced-motion`

Requires a reduced-motion fallback when static JSX/CSS-in-JS code declares transitions or animations.

Invalid:

```tsx
<button className="transition-opacity">Save</button>
```

Valid:

```tsx
<button className="transition-opacity motion-reduce:transition-none">Save</button>
```

### `anti-slop/no-hidden-reveal-default`

Flags reveal patterns that combine hidden default content with static motion.

Invalid:

```tsx
<section className="opacity-0 transition-opacity">Hidden until reveal</section>
```

Valid:

```tsx
<section className="opacity-100 transition-opacity">Visible content</section>
```

### `anti-slop/no-nested-cards`

Flags nested `Card` components or nested containers with a `card` class.

Invalid:

```tsx
<Card>
  <MetricCard />
</Card>
```

Valid:

```tsx
<Card>
  <section>Details</section>
</Card>
```

## Development

```bash
pnpm install
pnpm test
pnpm test:coverage
pnpm smoke:eslint9
pnpm secret:scan
pnpm dependency:security
pnpm verify
```

Rule tests use ESLint `RuleTester` through Node's built-in test runner. `pnpm
test:coverage` writes source LCOV to `coverage/lcov.info` for the repo's Pre-CR
coverage gate.

`pnpm verify` is the local pre-PR gate and the CI gate. It runs the RuleTester
suite, coverage, the smoke consumer, a packed-tarball install smoke, and Pre-CR
changed-line readiness.

`pnpm smoke:eslint9` installs `eslint-plugin-anti-slop` into `smoke-consumer/`
as a local `file:..` dependency with pnpm, then runs ESLint 9 against a small
JSX fixture, the `anti-slop` CLI, and the audit formatter. `pnpm smoke:consumer`
is kept as an alias for the same supported-major smoke.

## Quality Gate CLI

The package includes a gate runner for CI, local hooks, and Pre-CR-adjacent checks:

```bash
pnpm exec anti-slop check .
pnpm exec anti-slop gate --changed --mode block --format pre-cr
```

Run `anti-slop --help` after installing the package to inspect the available
commands.

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

Anti-Slop ESLint runners can emit AIOS-compatible audit artifacts with the
package formatter. For a repo that does not already have Anti-Slop in its ESLint
config, add the package config and keep the formatter in a dedicated script.

Install in the consumer repo:

```bash
pnpm add -D eslint eslint-plugin-anti-slop @typescript-eslint/parser
```

Add `eslint.aios-audit.config.mjs`:

```js
import antiSlopAiosAuditConfig from "eslint-plugin-anti-slop/aios-audit-config";

export default antiSlopAiosAuditConfig;
```

Add the package script:

```json
{
  "scripts": {
    "audit:anti-slop": "eslint . --config eslint.aios-audit.config.mjs --format ./node_modules/eslint-plugin-anti-slop/audit-formatter.mjs"
  }
}
```

Use the `./node_modules/.../audit-formatter.mjs` file path in `--format`;
ESLint's formatter loader treats package subpaths as local filesystem paths.

Run it with pnpm:

```bash
pnpm audit:anti-slop
```

If the repo already has an ESLint config with `anti-slop/*` rules enabled, keep
that config and add only the formatter script:

```json
{
  "scripts": {
    "audit:anti-slop": "eslint . --format ./node_modules/eslint-plugin-anti-slop/audit-formatter.mjs"
  }
}
```

The packaged config covers JavaScript, JSX, TypeScript, and TSX files and
ignores `.next`, `build`, `coverage`, `dist`, and `node_modules` output. To add
repo-specific ignores:

```js
import { antiSlopAiosAuditConfig } from "eslint-plugin-anti-slop/aios-audit-config";

export default antiSlopAiosAuditConfig({
  ignores: ["generated/**"],
});
```

The formatter records severity-2 `anti-slop/*` findings in
`.aios/audit/gate-events.jsonl` and refreshes `.aios/audit/gate-summary.md` plus
`.aios/audit/learning-lessons.md`. Each JSONL event uses the current AIOS gate
event envelope: `schema_version`, `event_id`, `timestamp`, `repo`, `branch`,
`commit_sha`, `run_id`, `actor_type`, `gate`, `gate_version`, `event_type`,
`severity`, `category`, `rule_id`, `rule_name`, `decision`, `summary`,
`evidence`, `failure_pattern`, `root_cause_hypothesis`, `required_fix`,
`actual_fix`, `learning_lesson`, `dedupe_fingerprint`, `related_event_ids`,
`blocked_duration_seconds`, `tokens_wasted_estimate`, and `notes`.

Findings are recorded as blocks on `main`, `master`, `dev`, `develop`,
`development`, or when `AIOS_DEV_ENVIRONMENT`, `AIOS_DEV_ENV`,
`QUALITY_GATE_DEV_ENV`, or `GATE_CONNECTED_DEV_ENV` is set; detected unprotected
feature branches are recorded as warnings. `AIOS_BRANCH` and `AIOS_RUN_ID` are
used when present, and otherwise the formatter falls back to the current git
branch. ESLint process exit behavior still depends on the runner's rule severity
and CLI settings.

## Design Principles

- Prefer high-confidence findings over style nits.
- Keep rules configurable by project vocabulary.
- Use warnings for judgment-heavy signals and errors for release-blocking patterns.
- Make violations actionable enough that an engineer knows what to change without reading the rule source.

## Release Checklist

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm verify`.
3. Update `CHANGELOG.md`.
4. Confirm `package.json` version and package metadata.
5. Publish with `pnpm publish` only from the final release step.
