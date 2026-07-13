# Roadmap: eslint-plugin-anti-slop

## Overview

`v0.3.0` is the released baseline. The active roadmap is the in-place
modernization sequence in `docs/modernization/EXEC_PLAN.md`; that document owns
the milestone detail, dependencies, preservation rules, and verification
criteria.

## Active Sequence

| Milestone | Purpose | Status |
| --- | --- | --- |
| M0 | Freeze public contracts and reconcile truth | Complete |
| M1 | Establish authoritative verification and release gates | Complete |
| M2 | Make CLI and gate analysis fail closed | Complete |
| M3 | Calibrate high-severity rule evidence | Complete |
| M4 | Consolidate catalog and finding ownership | Planned |
| M5 | Cut over, release, and remove migration debris | Planned |

## Deferred Work

The legacy QR remediation plans under `.planning/phases/04-qr-remediation-eslint-plugin-anti-slop/`
remain historical planning input. Reconcile their scope with M2–M4 before
execution; they must not create concurrent changes to the same rules or
helpers.

---
*Last updated: 2026-07-13*
