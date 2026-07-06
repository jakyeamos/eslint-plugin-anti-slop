# anti-slop/no-hidden-reveal-default

Discourage reveal animations that hide content by default.

## Why

Content gated behind `opacity-0` + a transition breaks when JavaScript fails, hurts LCP, and hides information from crawlers and screen-reader-adjacent tooling. Reveal motion should enhance already-visible content.

## Detection

Flags class strings combining a hidden default (`opacity-0`, `invisible`) with motion (`animate-*`, `transition*`, `duration-*`), style objects combining `opacity: 0`/`visibility: "hidden"` with `animation`/`transition`, and CSS strings doing the same. Static classes are also recovered from `clsx`/`cn`-style calls.

## Examples

Invalid:

```tsx
<section className="opacity-0 transition-opacity">Hidden until reveal</section>
```

Valid:

```tsx
<section className="opacity-100 transition-opacity">Visible content</section>
```

## Options

None.
