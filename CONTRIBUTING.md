# Contributing

This package is a small ESLint plugin, so product quality comes from predictable rule behavior, low false-positive rates, and clear adoption docs.

## Development

```bash
pnpm install
pnpm test
```

Use the standard verification gate before opening a pull request:

```bash
pnpm verify
```

`pnpm verify` runs the Node test suite (including RuleTester), writes source LCOV coverage, verifies the local file-dependency smoke consumer, and installs the packed tarball in an isolated fixture. `pnpm verify:local` additionally runs Pre-CR changed-line readiness and requires a globally installed `pre-cr`. CI runs `pnpm verify` on pull requests and pushes to `main`.

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
5. Create a GitHub release; the publish workflow reruns verification and publishes through npm trusted publishing with provenance.
