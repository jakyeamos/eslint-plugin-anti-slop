# eslint-plugin-anti-slop

Config-driven ESLint rules to block high-confidence UI/code slop in React/TypeScript projects.

## Install (local path)

```bash
npm install -D file:/Users/jakyeamos/projects/eslint-plugin-anti-slop
```

## Usage

```javascript
// eslint.config.mjs
import antiSlop from "eslint-plugin-anti-slop";
import antiSlopConfig from "./.config/anti-slop.json";

export default [
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    plugins: {
      "anti-slop": antiSlop,
    },
    settings: {
      "anti-slop": antiSlopConfig,
    },
    rules: {
      "anti-slop/no-unjustified-use-client": "error",
      "anti-slop/no-useless-memo": "warn",
      "anti-slop/no-placeholder-copy": "error",
      "anti-slop/no-marketing-copy": "warn",
      "anti-slop/require-empty-state-action": "warn",
      "anti-slop/no-demo-data-primary-path": "error",
      "anti-slop/no-generic-stat-label": "warn"
    }
  }
];
```

## Rules

- `anti-slop/no-unjustified-use-client`
- `anti-slop/no-useless-memo`
- `anti-slop/no-placeholder-copy`
- `anti-slop/no-marketing-copy`
- `anti-slop/require-empty-state-action`
- `anti-slop/no-demo-data-primary-path`
- `anti-slop/no-generic-stat-label`
