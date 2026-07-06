# anti-slop/no-placeholder-copy

Block placeholder text in user-facing JSX and copy-bearing object properties.

## Why

"Coming soon", "TODO", and "lorem ipsum" shipping to users signals unfinished product. The rule targets user-facing surfaces only, so internal constants stay legal.

## Detection

Checks JSX text, user-facing JSX attributes (`aria-label`, `alt`, `label`, `placeholder`, `title`), and object properties commonly bound to UI copy (`title`, `description`, `subtitle`, `label`, `placeholder`, `emptyMessage`, `heading`) against `settings["anti-slop"].placeholderPatterns` (default: `coming soon`, `todo`, `tbd`, `lorem ipsum`, `placeholder`).

## Examples

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

## Options

None. Configure patterns through `settings["anti-slop"].placeholderPatterns`.
