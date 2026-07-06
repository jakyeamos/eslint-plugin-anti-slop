# anti-slop/no-generic-stat-label

Discourage vague metric and section labels.

## Why

"Analytics", "Insights", and "Overview" are labels that could sit above any chart in any product. Domain-specific labels ("Failed payments") prove the dashboard means something.

## Detection

Heading text and metric-label attributes are matched against `settings["anti-slop"].genericStatLabels` (default: `performance`, `insights`, `overview`, `analytics`, `usage`, `activity`). Only exact generic labels are flagged; longer domain phrases that merely contain a pattern are allowed.

## Examples

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

## Options

None. Configure labels through `settings["anti-slop"].genericStatLabels`.
