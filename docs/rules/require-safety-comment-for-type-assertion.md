# anti-slop/require-safety-comment-for-type-assertion

Require a nearby `SAFETY:` comment for non-const TypeScript type assertions.

## Why

Type assertions can hide an unchecked boundary. A short invariant comment makes
the reason for the escape hatch reviewable and keeps future edits from treating
the assertion as self-evident.

## Detection

The rule reports `as Type` and `<Type>value` assertions unless a preceding
comment contains `SAFETY:`. The comment may sit immediately before the
assertion, before its containing variable/return/throw statement, or inline
before the asserted expression. `as const` and `<const>` are ignored.

## Examples

Invalid:

```ts
const user = input as User;
```

Valid:

```ts
// SAFETY: schema.parse established the User invariant.
const user = input as User;
```

## Options

None.

## When not to use it

Do not enable this rule for generated files or codebases that intentionally use
assertions as a documented local convention without invariant comments.
