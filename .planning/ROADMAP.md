# Roadmap: eslint-plugin-anti-slop

## Overview

`v0.5.0` is the released baseline. The in-place modernization sequence in
`docs/modernization/EXEC_PLAN.md` is complete; that document retains the
milestone detail, dependencies, preservation rules, and verification criteria.
The Node-support migration is released and the repository is back on `main`.

## Active Sequence

| Milestone | Purpose | Status |
| --- | --- | --- |
| M0 | Freeze public contracts and reconcile truth | Complete |
| M1 | Establish authoritative verification and release gates | Complete |
| M2 | Make CLI and gate analysis fail closed | Complete |
| M3 | Calibrate high-severity rule evidence | Complete |
| M4 | Consolidate catalog and finding ownership | Complete |
| M5 | Cut over, release hardening, and migration-debris cleanup | Complete |

## Release Handoff

The reviewed branch was merged to `main` before creating `v0.5.0`. The
publish workflow verified tag ancestry and published the package through npm
trusted publishing.

## Deferred Work

The legacy QR remediation plans under `.planning/phases/04-qr-remediation-eslint-plugin-anti-slop/`
remain historical planning input. Reconcile their scope with M2–M4 before
execution; they must not create concurrent changes to the same rules or
helpers.

---
*Last updated: 2026-07-17*
