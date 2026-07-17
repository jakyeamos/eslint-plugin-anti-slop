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

`pnpm verify` runs deterministic source checks, tests, an enforced coverage
threshold, a pack dry run, and the local file-dependency smoke consumer.
`pnpm verify:consumer-online` separately checks a packed tarball in a fresh
registry-backed consumer. `pnpm verify:local` additionally runs Pre-CR
changed-line readiness and requires a globally installed `pre-cr`. CI runs
`pnpm verify:ci`, which requires the online consumer check and a registry
dependency-audit report as well.

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
2. Run `pnpm verify:ci`.
3. Confirm `CHANGELOG.md` describes user-visible changes.
4. Confirm `package.json` version and metadata are correct.
5. Create a `v<package-version>` GitHub release tag on a reviewed commit
   reachable from `main`; the publish workflow verifies the tag/version and
   ancestry before publishing through npm trusted publishing with provenance.
   The package must declare `publishConfig.access: "public"`. If the GitHub
   release exists but npm still reports an older `latest` version, fix npm
   ownership/trusted-publisher setup and rerun the existing Publish workflow;
   do not create a second tag. The workflow's publish command is
   `pnpm publish --provenance --access public --no-git-checks`.
