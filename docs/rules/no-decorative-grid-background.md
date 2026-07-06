# anti-slop/no-decorative-grid-background

Discourage decorative CSS grid backgrounds unless the surface is a real canvas, map, or measurement tool.

## Why

Two-axis one-pixel gradient "blueprint" backgrounds are a common generated-UI decoration that adds noise without meaning.

## Detection

Flags class values, style object values, and standalone CSS strings/templates containing multi-axis `linear-gradient` patterns with 1px lines (a `90deg` second axis or repeated gradients).

## Examples

Invalid:

```tsx
<div style={{ backgroundImage: "linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)" }} />
```

Valid:

```tsx
<div className="grid grid-cols-2 gap-4" />
```

## Options

None.

## When not to use it

Real canvases, plotting surfaces, and design tools legitimately draw grid backgrounds; disable the rule for those components.
