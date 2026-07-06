# anti-slop/no-defensive-guard-sprawl

Discourage repeated defensive null/record guards in ordinary functions.

## Why

Stacked `if (x == null) return null;` guards at the top of every function obscure the real data contract. Shape validation belongs in one named validator, not sprinkled through business logic.

## Detection

Flags functions whose bodies open with more than `maxGuards` consecutive early-return/throw guards testing nullish conditions or `isRecord(...)`. Functions named like validators (`is*`, `has*`, `can*`, `should*`, `assert*`, `ensure*`, `validate*`) are exempt — they are allowed to own repeated checks.

## Examples

Invalid:

```ts
function parseUser(input) {
  if (!isRecord(input)) return null;
  if (input.id == null) return null;
  if (input.email == null) return null;
  return { id: input.id, email: input.email };
}
```

Valid:

```ts
function assertUserPayload(input) {
  if (!isRecord(input)) throw new Error("Invalid user");
  if (input.id == null) throw new Error("Invalid user");
  if (input.email == null) throw new Error("Invalid user");
}
```

## Options

```json
{
  "anti-slop/no-defensive-guard-sprawl": ["warn", { "maxGuards": 2 }]
}
```

- `maxGuards` (integer, default `2`): the largest number of leading defensive guards allowed before the function is flagged.
