# anti-slop/require-reduced-motion

Require a type-matched reduced-motion fallback when static UI code declares motion.

## Why

`prefers-reduced-motion` is an accessibility contract. Transitions and animations added without a fallback can cause discomfort for vestibular-sensitive users.

## Detection

Motion sources and their required fallbacks are checked in proximity, not file-wide:

- `animate-*` requires `motion-reduce:animate-none` in the same static class path and the same ordered non-motion variant scope.
- `transition*` requires `motion-reduce:transition-none` in the same static class path and the same ordered non-motion variant scope.
- Tailwind's leading or trailing important modifier is normalized. An important motion utility needs an equally important reduced-motion fallback.
- A fallback for one kind does not satisfy the other. `animate-none` and `transition-none` are not motion sources; `motion-reduce:` motion remains a source, while `motion-safe:`-prefixed motion is already guarded.
- CSS strings/templates need a matching disabled declaration on the same selector inside a top-level, direct media block whose query positively requires `prefers-reduced-motion: reduce` and has the same static non-motion media scope as its source. For example, a source in `@media screen` needs its fallback in `@media screen and (prefers-reduced-motion: reduce)`. Use `animation: none` or `animation-name: none` for animation, and `transition: none` for transitions. The fallback must win the cascade: normally it appears after the source, while a matching `!important` fallback can override a normal source. Every selector in a comma-separated source must be covered, and a comma-separated declaration is disabled only when every entry is `none`. A universal `*` fallback is not assumed to override a more-specific source selector. Nested selectors, nested conditional blocks such as `@scope` or `@starting-style`, and rules inside `@layer` are treated as insufficient static evidence rather than guessed at. Merely mentioning `prefers-reduced-motion`, using the wrong kind, a different selector, a different media scope, placing an equal-priority fallback before the source, or adding unrelated CSS does not count. Only a media block whose queries all positively require `no-preference` is treated as guarded.
- Style objects with static non-empty string `animation`, `animationName`, or `transition` values other than `none` are sources. Static `none`, `null`, `false`, and `0` values are not sources; static motion styles are flagged unless the file calls `useReducedMotion()`.

An actual `useReducedMotion()` call still gates the whole file; this is a deliberately broad heuristic, not proof that every motion source is conditional.

## Examples

Invalid:

```tsx
<button className="animate-spin motion-reduce:transition-none">Load</button>
```

Valid:

```tsx
<button className="animate-spin motion-reduce:animate-none">Load</button>
<button className="transition-opacity motion-reduce:transition-none">Save</button>
```

```css
.spinner { animation: spin 1s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}
```

## Options

None.
