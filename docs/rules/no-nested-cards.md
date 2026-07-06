# anti-slop/no-nested-cards

Discourage nested `Card` components or nested `card` class containers.

## Why

Cards inside cards double up borders, shadows, and padding — a framing hierarchy that reads as generated filler. Inner content usually wants a plain section.

## Detection

An element counts as a card when its component name is `Card` or ends with `Card`, or when its class list contains a `card`/`card-*`/`card_*` token. The rule reports the first card found nested anywhere inside another card.

## Examples

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

## Options

None.
