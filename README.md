# eslint-plugin-anti-slop

<p align="center"><strong>Config-driven ESLint rules for high-confidence React and TypeScript product-quality problems.</strong></p>

<p align="center">
  <img alt="Status: active ESLint plugin" src="https://img.shields.io/badge/status-active%20ESLint%20plugin-0f766e">
  <img alt="ESLint: 9" src="https://img.shields.io/badge/ESLint-9.x-4b32c3">
  <img alt="Node: 20+" src="https://img.shields.io/badge/Node-20%2B-339933">
  <img alt="Package manager: pnpm" src="https://img.shields.io/badge/package%20manager-pnpm-f59e0b">
</p>

`eslint-plugin-anti-slop` catches product and UI code patterns that make React/TypeScript apps feel unfinished: unjustified client components, placeholder copy, generic marketing text, demo data on primary routes, weak empty states, generic stat labels, defensive guard sprawl, and low-value memoization.

The plugin is intentionally opinionated. It focuses on rules that are specific enough to be useful in product repositories without turning lint into vague taste enforcement.

## Compatibility

- Node.js 20 or newer.
- ESLint 9.x with flat config.
- React/TypeScript projects using app, component, or library source paths.

ESLint 8 is not supported for the package CLI. Use ESLint 9 before adopting `anti-slop check` or `anti-slop gate`.

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

## CLI And Verification

Package scripts:

```bash
pnpm test
pnpm test:coverage
pnpm smoke:consumer
pnpm secret:scan
pnpm dependency:security
pnpm verify
```

The `anti-slop` binary exposes package-level checks used by adopting repos. Run `anti-slop --help` after installing the package to inspect the available commands.

## Design Principles

- Prefer high-confidence findings over style nits.
- Keep rules configurable by project vocabulary.
- Use warnings for judgment-heavy signals and errors for release-blocking patterns.
- Make violations actionable enough that an engineer knows what to change without reading the rule source.
