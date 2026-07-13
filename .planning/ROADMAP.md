# Roadmap: eslint-plugin-anti-slop

## Overview

`v0.3.0` is the released baseline. The in-place modernization sequence in
`docs/modernization/EXEC_PLAN.md` is complete; that document retains the
milestone detail, dependencies, preservation rules, and verification criteria.
The branch now carries a verified `0.4.0` candidate, not a release tag.

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

Merge the reviewed branch to `main` before creating a `v0.4.0` release. The
publish workflow rejects tags whose commits are not reachable from `main`; no
tag or package publication is part of this modernization branch.

## Deferred Work

The legacy QR remediation plans under `.planning/phases/04-qr-remediation-eslint-plugin-anti-slop/`
remain historical planning input. Reconcile their scope with M2–M4 before
execution; they must not create concurrent changes to the same rules or
helpers.

---
*Last updated: 2026-07-13*
