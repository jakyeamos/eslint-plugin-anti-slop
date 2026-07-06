# anti-slop/no-gradient-text

Discourage gradient-clipped text in product UI.

## Why

Gradient text (`bg-clip-text` + `text-transparent` + a gradient) is a strong generated-UI tell and rarely earns its accessibility and contrast costs. Solid text colors and typographic hierarchy communicate better.

## Detection

Flags class strings combining a clip class, transparent text, and a gradient class, and style objects combining `backgroundClip: "text"` with a gradient background. Static classes are also recovered from `clsx`/`cn`/`cva`-style calls, arrays, conditionals, and template literals.

## Examples

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

## Options

None.

## When not to use it

Brand/hero surfaces that intentionally use gradient display text can disable the rule for marketing routes.
