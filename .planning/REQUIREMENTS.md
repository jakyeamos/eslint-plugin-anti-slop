# Requirements: eslint-plugin-anti-slop

**Core value:** Teams should be able to enforce anti-slop rules directly in
ESLint with a simple, trustworthy integration path.

## Baseline Complete at v0.3.0

- [x] **ESL-01**: A developer can install the plugin locally and resolve it
  from a consumer project.
- [x] **ESL-02**: A developer can load the rule set in an ESLint flat-config
  setup.
- [x] **ESL-03**: README and rule documentation describe the supported
  integration path and rule inventory.
- [x] **ESL-04**: The repository has Git and planning state for structured
  follow-up work.
- [x] **ESL-05**: Rule behavior is backed by tests and consumer examples.
- [x] **ESL-06**: Packaging and release steps are documented and automated.

## Active Modernization Requirements

- [x] **MOD-01**: Every published package entrypoint, preset, rule/document
  relationship, CLI mode/format, baseline, and audit artifact has executable
  contract coverage.
- [x] **MOD-02**: A packed consumer compiles the complete public declaration
  surface with TypeScript and no source-private imports.
- [x] **MOD-03**: Contributor, planning, and truth documents describe the
  released baseline and the commands that actually run.
- [x] **MOD-04**: Deterministic verification is distinct from fresh online
  package compatibility and registry dependency-audit checks.
- [x] **MOD-05**: CI and release enforce exact supported Node floors, immutable
  workflow actions, a packed ESLint 9.0 consumer smoke, and tag/version parity.
- [x] **MOD-06**: Gate configuration, baselines, and analysis failures cannot
  return a passing result; requested mode, effective policy, analysis status,
  and audit history migration are represented explicitly.

## Deferred

- **QR-ESLINT-PLUGIN-ANTI-SLOP**: The legacy Quality Runner remediation plan
  remains deferred until it is reconciled with the approved modernization
  sequence. It must not run in parallel with overlapping rule work.

## Traceability

| Requirement group | Milestone | Status |
| --- | --- | --- |
| ESL-01 through ESL-06 | v0.3.0 baseline | Complete |
| MOD-01 through MOD-03 | M0: contract freeze and truth reconciliation | Complete |
| MOD-04 through MOD-05 | M1: verification and release gate | Complete |
| Gate correctness | M2 | Complete |
| Rule-confidence calibration | M3 | Planned |
| Internal ownership consolidation | M4 | Planned |

---
*Last updated: 2026-07-13*
