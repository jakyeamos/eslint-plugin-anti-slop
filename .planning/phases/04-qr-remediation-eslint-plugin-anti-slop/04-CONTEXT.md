# Phase 4: QR remediation: eslint-plugin-anti-slop - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Source:** PRD Express Path (/Users/jakyeamos/.local/state/quality-runner/fleet/per-repo-summaries-20260704/eslint-plugin-anti-slop.md)

<domain>
## Phase Boundary

Plan the remediation work for eslint-plugin-anti-slop from Quality Runner run qr-fleet-continue-20260704-eslint-plugin-anti-slop.
This phase is planning-only until execute-phase runs. Quality Runner remains advisory-only: it identifies findings, remediation clusters, and verification suggestions, but all source changes happen in /Users/jakyeamos/projects/eslint-plugin-anti-slop.

Findings: 6
Severity: `observation` 3, `warning` 3
Categories: `structural:deduplicate` 1, `structural:harden` 1, `structural:ponytail` 2, `structural:simplify` 2
Fleet phase candidate: Phase 3 - Mixed Medium Repos
Requirement: QR-ESLINT-PLUGIN-ANTI-SLOP

</domain>

<decisions>
## Implementation Decisions

### D-01 - QR summary is the planning source
- Use /Users/jakyeamos/.local/state/quality-runner/fleet/per-repo-summaries-20260704/eslint-plugin-anti-slop.md and the artifacts under /Users/jakyeamos/projects/eslint-plugin-anti-slop/.quality-runner/runs/qr-fleet-continue-20260704-eslint-plugin-anti-slop as the source of truth for this remediation phase.

### D-02 - Cluster-oriented remediation
- Plan and execute coherent remediation batches by QR cluster, not one isolated edit per finding row.

### D-03 - Behavior preservation
- Prefer behavior-preserving refactors, hardening, and simplification. Do not change product behavior unless a QR hardening cluster explicitly requires safer behavior.

### D-04 - Existing project conventions first
- Read the target files and local manifests before editing. Follow existing package-manager, formatter, test, and architecture conventions. Use pnpm for JavaScript package scripts.

### D-05 - Evidence-backed closure
- A cluster is done only when focused repo verification passes and a post-remediation QR run shows the fingerprints cleared or are dispositioned with evidence.

### Claude's Discretion
- Choose exact helper extraction boundaries, naming, and task order when the QR document identifies the finding but not the implementation shape.
- If a cluster turns out to require product, API, or design decisions, stop that cluster and capture the question instead of guessing.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Quality Runner Inputs
- `/Users/jakyeamos/.local/state/quality-runner/fleet/per-repo-summaries-20260704/eslint-plugin-anti-slop.md` - Per-repo QR summary used as this phase PRD.
- `/Users/jakyeamos/projects/eslint-plugin-anti-slop/.quality-runner/runs/qr-fleet-continue-20260704-eslint-plugin-anti-slop/quality-audit.json` - Quality audit report.
- `/Users/jakyeamos/projects/eslint-plugin-anti-slop/.quality-runner/runs/qr-fleet-continue-20260704-eslint-plugin-anti-slop/remediation-plan.json` - QR remediation plan.
- `/Users/jakyeamos/projects/eslint-plugin-anti-slop/.quality-runner/runs/qr-fleet-continue-20260704-eslint-plugin-anti-slop/code-quality-scan.json` - Code-quality scan fingerprints.
- `/Users/jakyeamos/projects/eslint-plugin-anti-slop/.quality-runner/runs/qr-fleet-continue-20260704-eslint-plugin-anti-slop/resolution-ledger.md` - Resolution ledger for closure evidence.
- `/Users/jakyeamos/projects/eslint-plugin-anti-slop/.quality-runner/runs/qr-fleet-continue-20260704-eslint-plugin-anti-slop/agent-handoff.md` - QR agent handoff.

</canonical_refs>

<specifics>
## Top Findings

- `structural-simplify-deep-nesting` warning structural:simplify: 110 deep-nesting structural findings in simplification and shrink pass. Fix: 110 findings, aggregate score 660: Flatten guard clauses, extract decision helpers, or split rendering branches. Evidence: scripts/check-js-syntax.mjs:16: deep-nesting; scripts/dead-code-check.mjs:95: deep-nesting; scripts/format-check.mjs:23: deep-nesting
- `structural-simplify-nested-ternary` warning structural:simplify: 2 nested-ternary structural findings in simplification and shrink pass. Fix: 2 findings, aggregate score 18: Replace nested ternaries with named branches or helpers. Evidence: src/audit.mjs:175: nested-ternary; src/gate.mjs:88: nested-ternary
- `structural-deduplicate-near-duplicate-function` warning structural:deduplicate: 2 near-duplicate-function structural findings in duplicate consolidation and helper extraction. Fix: 2 findings, aggregate score 12: Extract a shared helper only when the call sites share domain semantics. Evidence: src/audit.mjs:260: near-duplicate-function; test/rules.test.mjs:247: near-duplicate-function
- `structural-harden-console-output` observation structural:harden: 8 console-output structural findings in API hardening and logging. Fix: 8 findings, aggregate score 16: Use structured logging or remove runtime console output. Evidence: scripts/check-js-syntax.mjs:40: console-output; scripts/check-js-syntax.mjs:44: console-output; scripts/dead-code-check.mjs:108: console-output
- `structural-ponytail-pass-through-wrapper` observation structural:ponytail: 8 pass-through-wrapper structural findings in Ponytail debt: shrink. Fix: 8 findings, aggregate score 16: Call the delegated function directly or give the wrapper real policy. Evidence: src/audit.mjs:13: pass-through-wrapper; src/audit.mjs:137: pass-through-wrapper; src/cli.mjs:178: pass-through-wrapper
- `structural-ponytail-undocumented-env-flag` observation structural:ponytail: 1 undocumented-env-flag structural finding in Ponytail debt: yagni. Fix: 1 findings, aggregate score 2: Document VERCEL_ENV or remove the one-off configuration branch. Evidence: src/audit.mjs:105: undocumented-env-flag

## Remediation Clusters

1. remediate-structural-src-rules-no-unjustified-use-client-mjs (medium, score 96) - Remediate structural cluster in src/rules/no-unjustified-use-client.mjs
2. remediate-structural-src-rules-no-generic-stat-label-mjs (medium, score 62) - Remediate structural cluster in src/rules/no-generic-stat-label.mjs
3. remediate-structural-src-rules-require-reduced-motion-mjs (medium, score 50) - Remediate structural cluster in src/rules/require-reduced-motion.mjs
4. remediate-structural-src-rules-no-decorative-grid-background-mjs (medium, score 42) - Remediate structural cluster in src/rules/no-decorative-grid-background.mjs
5. remediate-structural-src-rules-no-hidden-reveal-default-mjs (medium, score 42) - Remediate structural cluster in src/rules/no-hidden-reveal-default.mjs
6. remediate-structural-src-rules-no-useless-memo-mjs (medium, score 42) - Remediate structural cluster in src/rules/no-useless-memo.mjs

</specifics>

<deferred>
## Deferred Ideas

- Broad rewrites outside the QR clusters.
- Running Quality Runner as an executor or letting QR mutate source code.
- Remediating repos outside eslint-plugin-anti-slop; each repo gets its own GSD phase.

</deferred>

---

*Phase: 4*
*Context gathered: 2026-07-04 via QR per-repo PRD*
