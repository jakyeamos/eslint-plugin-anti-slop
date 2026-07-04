# Roadmap: eslint-plugin-anti-slop

## Overview

Bootstrap roadmap for taking this brownfield repo from current-state discovery to a clean, plan-ready execution baseline.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Bootstrap Repository Discipline** - Add the missing repo and planning baseline needed for intentional iteration.
- [ ] **Phase 2: Verify Consumer Integration** - Confirm the plugin works cleanly in the local sibling-consumer setup.
- [ ] **Phase 3: Plan Rule Hardening** - Define the highest-value next steps for strengthening rules and release readiness.

## Phase Details

### Phase 1: Bootstrap Repository Discipline
**Goal**: Add the missing repo and planning baseline needed for intentional iteration.
**Depends on**: Nothing (first phase)
**Requirements**: [ESL-04]
**Success Criteria** (what must be TRUE):
  1. The repo has git initialized.
  2. Planning documents exist for future phase work.
  3. The project can be managed like the rest of the owned toolchain.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Create repo baseline
- [ ] 01-02: Capture current product context

### Phase 2: Verify Consumer Integration
**Goal**: Confirm the plugin works cleanly in the local sibling-consumer setup.
**Depends on**: Phase 1
**Requirements**: [ESL-01, ESL-02, ESL-03]
**Success Criteria** (what must be TRUE):
  1. A consumer project can resolve and load the plugin.
  2. Flat-config usage stays aligned with the documented example.
  3. The current rule inventory is clearly documented.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Validate local consumer integration
- [ ] 02-02: Tighten docs and examples

### Phase 3: Plan Rule Hardening
**Goal**: Define the highest-value next steps for strengthening rules and release readiness.
**Depends on**: Phase 2
**Requirements**: [ESL-01, ESL-02]
**Success Criteria** (what must be TRUE):
  1. The next hardening work is explicitly queued.
  2. Open packaging or validation gaps are visible.
  3. Future plugin work can start from a documented baseline.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Prioritize next rule work
- [ ] 03-02: Capture packaging and validation follow-ups

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bootstrap Repository Discipline | 0/2 | Not started | - |
| 2. Verify Consumer Integration | 0/2 | Not started | - |
| 3. Plan Rule Hardening | 0/2 | Not started | - |

### Phase 4: QR remediation: eslint-plugin-anti-slop



**Goal:** Resolve Quality Runner findings for eslint-plugin-anti-slop using cluster-oriented, behavior-preserving remediation from run qr-fleet-continue-20260704-eslint-plugin-anti-slop.
**Requirements**: QR-ESLINT-PLUGIN-ANTI-SLOP
**Depends on:** Phase 3
**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md - Primary QR cluster remediation
- [ ] 04-02-PLAN.md - Additional QR cluster remediation

**Cross-cutting constraints:**
- The post-remediation QR run records no unresolved regression for this plan scope.
