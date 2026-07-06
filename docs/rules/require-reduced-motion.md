# anti-slop/require-reduced-motion

Require a reduced-motion fallback when static UI code declares motion.

## Why

`prefers-reduced-motion` is an accessibility contract. Transitions and animations added without a fallback can cause discomfort for vestibular-sensitive users.

## Detection

Motion sources and their required fallbacks are checked in proximity, not file-wide:

- Class strings declaring motion (`transition*`, `animate-*`, including variant-prefixed forms like `hover:transition` and `md:animate-spin`) need a `motion-reduce:` fallback token in the same class string. `motion-safe:`-prefixed motion is treated as already guarded.
- CSS strings/templates declaring `animation:`/`transition:` need `prefers-reduced-motion` in the same string.
- Style objects declaring `animation`/`animationName`/`transition` are flagged unless the file actually references `useReducedMotion`.

A real `useReducedMotion` reference (not just the text appearing somewhere) gates the whole file, since motion is then assumed to be conditionally applied.

## Examples

Invalid:

```tsx
<button className="transition-opacity">Save</button>
<button className="hover:transition-transform">Save</button>
```

Valid:

```tsx
<button className="transition-opacity motion-reduce:transition-none">Save</button>
<button className="motion-safe:animate-pulse">Save</button>
```

## Options

None.
