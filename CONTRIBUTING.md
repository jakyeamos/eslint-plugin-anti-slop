# Contributing

This package is a small ESLint plugin, so product quality comes from predictable rule behavior, low false-positive rates, and clear adoption docs.

## Development

```bash
pnpm install
pnpm test
```

Use the full local gate before opening a pull request:

```bash
pnpm verify
```

`pnpm verify` runs the RuleTester suite, emits LCOV coverage for Pre-CR, checks changed-line coverage, and smoke-packs the npm tarball.

## Rule Quality Bar

Every rule change must include:

- Valid and invalid `RuleTester` fixtures.
- At least one fixture for the bug or behavior being changed.
- A false-positive fixture when broadening detection.
- README examples when the user-facing rule contract changes.

Prefer fixtures that look like real React or TypeScript code. Avoid testing only tiny AST fragments when a realistic component better captures the behavior.

## Documentation Bar

Update docs when changing:

- rule names or severity recommendations
- preset exports
- config keys or default vocabulary
- install, verification, or release steps
- packaging metadata that affects consumers

## Release Checklist

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm verify`.
3. Confirm `CHANGELOG.md` describes user-visible changes.
4. Confirm `package.json` version and metadata are correct.
5. Publish with `pnpm publish` when ready.
