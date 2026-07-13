# Modernization Execution Plan

## Strategy

**Chosen strategy: A — deep internal refactor in place.**

The `v0.3.0` package is the behavior baseline. Each milestone is a complete,
verifiable slice and leaves the package runnable. The plan deliberately avoids
parallel old/new implementations except for short-lived internal adapters
needed to preserve a public import path during a refactor.

## Global Guardrails

- Preserve the public contracts listed in `AUDIT.md` unless the milestone
  explicitly declares a versioned behavior change and migration note.
- Add characterization fixtures before changing rule, gate, CLI, formatter, or
  report behavior.
- Use the current RuleTester, local consumer, packed-tarball smoke, and real
  CLI invocations as consumer-level proof.
- When an internal owner replaces a duplicated concept, migrate every consumer
  and delete the stale path in the same milestone.
- Do not weaken types, skip tests, disable lint rules, or hide parser/config
  failures to retain a green result.
- Keep `.planning/STATE.md` and `.tracker/PROJECT_TRUTH.md` as bounded current
  snapshots after each completed milestone.

## Milestones

### M0 — Freeze public behavior and reconcile truth

**Objective:** Make the current `v0.3.0` contract executable before modifying
it, and make all project-state documents agree with the released baseline.

| Item | Plan |
| --- | --- |
| Affected areas | `test/`, `scripts/smoke-published.mjs`, `README.md`, `CONTRIBUTING.md`, `.planning/`, `.tracker/` |
| Preserve | All package exports, rule IDs/options/severities, CLI modes/formats/exits, artifact paths, baseline/fingerprint behavior |
| Intentionally change | Documentation and state drift only |
| Work | Add contract tests for every exported subpath, preset/docs parity, CLI mode/format/baseline transitions, audit schema/artifacts, and packed TypeScript declaration resolution. Correct the command matrix and release state. |
| Verification | Existing `pnpm verify`; new declaration consumer `--noEmit`; package dry-run; focused docs link/reference checks |
| Rollback | Revert documentation/test commit; no runtime or data migration |
| Completion | A clean checkout can prove current public behavior and docs describe only commands that actually run. |
| Delete | Stale release claims and obsolete bootstrap status, not shipped interfaces. |

### M1 — Create an authoritative verification and release gate

**Objective:** Make the checks claimed by contributors, CI, and releases
explicit, runnable, and appropriately strict.

| Item | Plan |
| --- | --- |
| Affected areas | `package.json`, `scripts/`, `.github/workflows/`, test/type fixtures, `README.md`, `CONTRIBUTING.md` |
| Depends on | M0 |
| Preserve | pnpm workflow, Node ESM delivery, OIDC/provenance publish, local linked-checkout smoke |
| Intentionally change | Command names and docs may become more precise; CI gains missing deterministic checks |
| Work | Rename syntax-only checking honestly; add packed TypeScript declaration compilation; separate deterministic local verification from explicit online consumer and supply-chain checks; exercise CLI/config/formatter smoke at the ESLint 9.0 floor; assert release tag/package version; decide action-pin and permissions hardening. |
| Verification | Deterministic gate on Node 20.19/22.13/24, required online packed-consumer and dependency-audit checks, ESLint 9.0 real-consumer smoke, packaged type fixture, release-workflow static validation |
| Rollback | Retain existing script aliases during transition if consumers use them; revert CI-only changes independently |
| Completion | CI, release workflow, README, CONTRIBUTING, and PR template name the same authoritative checks. |
| Delete | Misleading `typecheck`/coverage claims and duplicated verification guidance. |

### M2 — Make CLI and gate analysis fail closed

**Objective:** Ensure a passing gate means source was analyzed under valid
configuration and a clear policy.

| Item | Plan |
| --- | --- |
| Affected areas | `src/cli.mjs`, `src/gate.mjs`, `src/audit.mjs`, declarations, `test/cli.test.mjs`, `test/gate.test.mjs`, `test/audit.test.mjs`, docs/changelog |
| Depends on | M0; M1 is recommended but not a semantic prerequisite |
| Preserve | Existing CLI entrypoint, supported flags/formats, success behavior for valid configs, artifacts, and v0.3 baseline compatibility unless explicitly migrated |
| Intentionally change | Invalid configs, malformed baselines, and fatal ESLint/parser failures return clear non-success results; root help succeeds; clean-tree `--changed` no longer silently scans all files; warning audit events no longer claim a block. |
| Work | Introduce validated config and analysis-status contracts; distinguish requested mode/effective policy/decision; unify gate and audit identity; define empty changed-set behavior; add exact error/report fixtures and migration notes if fingerprints change. |
| Verification | Focused CLI/gate/audit tests for invalid config, parser error, root help, empty changed set, every mode/format, baseline compatibility, and audit event semantics; then full deterministic gate and packed smoke. |
| Rollback | Revert behavior as one coherent release-unit; preserve v0.3 baselines and retain schema-segregated audit history when fingerprint identity changes. |
| Completion | No analysis/configuration failure can be reported as a passing analysis. |
| Delete | Ambiguous direct `audit` policy path and duplicated finding-pattern logic. |

### M3 — Calibrate high-severity rule evidence

**Objective:** Improve confidence and autofix safety for existing rules before
expanding the catalog.

| Item | Plan |
| --- | --- |
| Affected areas | relevant files in `src/rules/`, `_shared.mjs`, `_ui-structural.mjs`, RuleTester fixtures, rule docs, metadata, changelog |
| Depends on | M0; M2 if confidence metadata is shared with the gate |
| Preserve | Rule IDs and ordinary valid/invalid behavior unless a documented false-positive/failure case demands correction |
| Intentionally change | Narrow unsafe autofixes; correct fixture-data, reduced-motion, class-path, and empty-state evidence handling based on characterized examples. |
| Work | Add false-positive and false-negative fixtures first; make class extraction represent possible class paths rather than unioning mutually exclusive branches; require animation-appropriate fallbacks; decide and document fixture fallback semantics; establish local empty-state/action boundaries; classify rule confidence and autofix safety. |
| Verification | Focused valid/invalid RuleTester cases, false-positive corpus, full rule suite, local consumer and packed smoke; inspect docs/config compatibility. |
| Rollback | Revert affected rule behavior by rule with release notes; retain fixtures that document the reason. |
| Completion | Error-level findings and autofixes have consumer-shaped evidence and documented limits. |
| Delete | Flattened class-evidence behavior and any unsafe fixer path superseded by the new model. |

### M4 — Consolidate catalog and finding ownership

**Objective:** Replace manual registry/metadata/report drift with one internal
source of truth without changing consumer import paths.

| Item | Plan |
| --- | --- |
| Affected areas | `src/index.mjs`, `src/rule-metadata.mjs`, proposed `src/internal/rules/`, `src/gate.mjs`, `src/audit.mjs`, declarations, contract tests |
| Depends on | M0–M3 |
| Preserve | All public modules, default/named exports, rule docs URLs, preset output, CLI reports, audit schema, formatter path |
| Intentionally change | Internal module ownership only |
| Work | Introduce a canonical rule manifest and derive plugin registration, presets, docs URLs, metadata lookup, and SARIF records from it. Extract pure finding normalization/identity/rendering from adapters where it eliminates duplication. Keep current public modules as thin facades. |
| Verification | Golden parity tests against M0 contract fixtures; all rule, CLI, gate, audit, type, consumer, and packed-tarball checks; dependency-cycle scan. |
| Rollback | Preserve old public facades until parity is proven; revert the internal manifest refactor as one atomic change if a public diff appears. |
| Completion | One owner exists for rule catalog and finding identity; no duplicate registry or metadata table remains. |
| Delete | The 16 manual imports/object registration, in-place docs URL mutation, hand-maintained metadata table, and duplicate pattern helpers. |

### M5 — Cutover, release readiness, and cleanup

**Objective:** Ship a coherent 0.4 hardening release with no migration debris.

| Item | Plan |
| --- | --- |
| Affected areas | package metadata, CHANGELOG, README, CONTRIBUTING, docs/rules, workflows, state/truth files |
| Depends on | M1–M4 |
| Preserve | Package name, ESM surface, Node/ESLint support policy unless a release decision says otherwise |
| Intentionally change | Documented correctness fixes and verification workflow |
| Work | Compare the complete branch to `v0.3.0`; remove obsolete shims/tests/dependencies; run adversarial review for public contract, package contents, policy exits, type declarations, and release workflow; document baseline migration only if needed. |
| Verification | Full Node matrix, ESLint 9.0/current smoke, all deterministic and supply-chain checks, package dry-run, packed consumer/type compile, clean worktree, release tag/version assertion. |
| Rollback | Publish only after the full gate; `v0.3.0` remains installable. If a post-release regression appears, release a patch or direct consumers to the prior version. |
| Completion | No confirmed P0/P1 issue remains, every remaining P2 is fixed or explicitly deferred, and docs match released behavior. |
| Delete | Temporary adapters, migration flags, stale docs, and unused dependencies. |

## Likely Failure Modes

| Failure mode | Prevention |
| --- | --- |
| Baselines stop suppressing known findings | Golden-test v0.3 fingerprints; version/migrate only intentional changes. |
| A refactor breaks a package subpath or declaration | Packed consumer imports every subpath and compiles with `--noEmit`. |
| A parser error appears as a clean gate | Model analysis failure separately and test its exit/report behavior. |
| A heuristic improvement creates new false positives | Add consumer-shaped valid fixtures before implementation and test class paths, not flattened class strings. |
| CI becomes flaky due to registry availability | Split deterministic verification from explicit online supply-chain policy. |
| Documentation diverges again | Generate/assert selected contract tables where useful and update state as a bounded snapshot per milestone. |

## Final Cutover Checklist

1. Run the full verification matrix and inspect every public package export.
2. Exercise CLI help, every mode/format, invalid configuration, parser failure,
   empty `--changed`, baselines, and audit formatter artifacts.
3. Validate all existing rule docs and consumer-shaped false-positive fixtures.
4. Diff package tarball contents and declarations against `v0.3.0`.
5. Review release tag, version, provenance, rollback guidance, and known risks.
6. Remove stale implementation paths, temporary shims, stale planning claims,
   and untracked/generated artifacts from the release scope.
