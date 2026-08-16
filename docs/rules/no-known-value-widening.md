# anti-slop/no-known-value-widening

Discourage known values from flowing into broad or anonymous TypeScript targets.

## Why

Explicitly widening an object, literal, or stable const binding can discard
property and literal evidence that later code could otherwise use. Keeping the
inferred shape makes the contract visible and avoids recovering it with casts.

## Detection

The rule reports known literals, objects, arrays, functions, class instances,
and stable `const` bindings assigned to `unknown`, `object`, open dictionaries
such as `Record<string, T>`, or anonymous object types. It also checks explicit
return types, class properties, assignments, and assertions.

Empty object dictionary initializers are allowed because they are commonly
intentional accumulators. Named interfaces and aliases that describe a closed
owner contract, `satisfies`, and values returned from calls are also allowed.

## Examples

Invalid:

```ts
const command = { run: () => {} };
const commands: Record<string, () => void> = { run: () => {} };
```

Valid:

```ts
const commands = { run: () => {} } satisfies Record<string, () => void>;
```

## Options

None.

## When not to use it

Keep this rule in the evidence preset for projects whose public API or
serialization layer intentionally uses broad containers. Prefer named aliases
for those contracts so the broad boundary remains explicit.
