# anti-slop/no-marketing-copy

Discourage generic marketing language inside product UI.

## Why

"Unlock powerful insights" tells users nothing about the workflow in front of them. Product UI copy should describe concrete actions and objects.

## Detection

User-facing JSX text and copy-bearing object properties are matched against `settings["anti-slop"].marketingPatterns` (default: `powerful`, `seamless`, `unlock`, `supercharge`).

## Examples

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

## Options

None. Configure patterns through `settings["anti-slop"].marketingPatterns`.

## When not to use it

Marketing/landing page routes are legitimate homes for this vocabulary; scope the rule to product surfaces via your ESLint config `files` globs.
