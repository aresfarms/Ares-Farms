# Governance Classification Integrity Doctrine — v1

**Volume:** VI-A. **Status:** Ratified (base rule + tier/severity amendment). Generated from ratified conversation text 2026-06-04.

---

## VIA-GOVERNANCE-CLASSIFICATION-001

A governance classification may not be modified solely to obtain a passing verification result.

If a Module 45 authority, capability, control, role, or binding is reclassified from `ACTIVE` / `ALPHA_REQUIRED` / `REQUIRED` to `HELD` / `DEFERRED` / `BLOCKED_BY_DESIGN`, the reclassification must reflect the actual operational state of the institution.

The institution shall document:

1. The previous classification.
2. The proposed classification.
3. The reason for the change.
4. The governance authority approving the change.
5. The effective date.
6. The expected activation criteria.

Verification outcomes shall be a consequence of accurate governance classification. Governance classifications shall not be modified for the purpose of forcing a verification gate to pass. **The correct governance state and the correct verification result must always be aligned.**

---

## Amendment — scope covers tier AND severity changes

The rule applies to both:

1. **Tier changes** — `ALPHA_REQUIRED` · `REQUIRED` · `HELD` · `DEFERRED` · `BLOCKED_BY_DESIGN`
2. **Severity changes** — `FAIL` · `WARN` · `FINDING` · `INFORMATIONAL`

Any classification change that alters verification outcomes, gate behavior, audit reporting, or operational status must be recorded in the **Classification Change Registry**, with: previous classification, new classification, reason, approver, effective date, resolution criteria.

Verification outcomes must remain a consequence of accurate classification rather than a goal of the classification process.

> **Long-term enforcement:** `build:self-report` shall emit active Classification Change Registry entries on every run (e.g. `Classification Changes Active: 1 — CCR-2026-001 — GATE_AUTHORITY_UNASSIGNED FAIL → WARN — Reason: Operational Governance State`), giving auditors, founders, regulators, and acquirers a trail instead of a claim.
