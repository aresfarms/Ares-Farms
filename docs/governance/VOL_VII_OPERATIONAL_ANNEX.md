# Volume VII — Operational Annex (Public Alpha)

**Status:** Active (Public Alpha).
**Source artifacts:** ratified Vol VI-A doctrine drops 2026-06-04 (`docs/DOCTRINE_VIA_AUDIT_001_005_INDEPENDENT_VERIFICATION.md`, `docs/GOVERNANCE_EXCEPTION_REGISTRY.md`, `docs/DOCTRINE_VIA_GOVERNANCE_CLASSIFICATION_001.md`, `docs/CLASSIFICATION_CHANGE_REGISTRY.md`, `docs/DOCTRINE_VIA_STEWARDSHIP_004_005.md`) + Public Alpha Execution Runbook Step 1 table.
**Machine-readable mirror:** `docs/governance/VOL_VII_OPERATIONAL_ANNEX.json`.

This Annex records WHO clears WHAT at Public Alpha. Holder names land here; the Module 45 binding-level registry (`src/lib/human-authority/humanAuthorityRegistryRuntime.ts`) records WHAT IS CLEARABLE. The mapping table at the end of this file is the **traceability link** Step 2 of the runbook requires: every Module 45 binding must trace to either a VI-A active-fill authority, a record-only steward, a held authority, an unfilled-by-design authority, or an external authority — untraceable = FAIL.

---

## 1. Active-Fill Authorities (7)

| # | Authority | Holder | Status | Effective Date | Quorum |
|---|---|---|---|---|---|
| A1 | Governance Authority | Caitlin Hudson + 2-of-3 founder quorum to clear | ACTIVE | _[recorded at Ceremony Part D]_ | 2-of-3 founders |
| A2 | Compliance Authority | Caitlin Hudson | ACTIVE | _[recorded at Ceremony Part D]_ | 1 |
| A3 | Data Rights Authority | Caitlin Hudson | ACTIVE | _[recorded at Ceremony Part D]_ | 1 |
| A4 | Capital & Financing Authority | Stuart Fraass | ACTIVE | _[recorded at Ceremony Part D]_ | 1 |
| A5 | Borrower Escalation Authority | Stuart Fraass | ACTIVE | _[recorded at Ceremony Part D]_ | 1 |
| A6 | Communications Authority | Frances Fraass | ACTIVE | _[recorded at Ceremony Part D]_ | 1 |
| A7 | Public Trust / Disclosure Authority | Frances Fraass | ACTIVE | _[recorded at Ceremony Part D]_ | 1 |

---

## 2. Record-Only Authorities

| Domain | Holder | Notes |
|---|---|---|
| Technical Infrastructure (VIA-STEWARD-004) | Caitlin Hudson | Builder; cannot independently certify own controls for production (VIA-AUDIT-001). |
| Platform Architecture | Caitlin Hudson | Subsumed under Technical Infrastructure stewardship. |

---

## 3. Held Authorities

| Domain | Status | Activation Trigger |
|---|---|---|
| Deployment | Held | Production gate chain (Modules 27–41). Not required for Alpha. |
| Treasury & Institutional Capital (VIA-STEWARD-005) | Held / Steward Deferred | Institutional reserve creation, external investment acceptance, or governance-set revenue threshold. |

---

## 4. Unfilled-by-Design Authorities

| Authority | Reason | Compensating Control |
|---|---|---|
| Independent Verification Authority | No appointed IVA at Alpha entry | VIA-AUDIT-EXCEPTION-001 — Technical Infrastructure Steward performs internal verification; results labeled "Internally Verified — Independent Verification Pending." |
| Audit Certification Authority | Not yet appointed | Same exception. |
| Build Verification Authority | Not yet appointed | Same exception. |

---

## 5. External Authority

| Authority | Holder | Notes |
|---|---|---|
| Credit / Eligibility Authority | Lender / agency (external) | Never Furlong, never AI. Furlong does not lend or decide credit. |

---

## 6. VI-A Authority → Module 45 Role Traceability

Every Module 45 binding must trace to one of the categories above (Active-Fill / Record-Only / Held / Unfilled-by-Design / External). This is the §2 traceability check from the runbook.

| Module 45 role | Traces to | Mapping confidence |
|---|---|---|
| `CHIEF_GOVERNANCE_AUTHORITY` | A1 Governance Authority — Caitlin + 2-of-3 quorum | CANONICAL (runbook explicit) |
| `GOVERNANCE_OPERATOR` | A1 Governance Authority — Caitlin (day-to-day operator queue, reviews, notices) | CANONICAL (runbook explicit) |
| `QUALIFIED_GOVERNANCE_REVIEWER` | A5 Borrower Escalation Authority — **Stuart** | CANONICAL via **AAR-2026-001** + Scope Confirmation Appendix |
| `DATA_RIGHTS_OFFICER` | A3 Data Rights Authority — Caitlin | CANONICAL (runbook explicit) |
| `REGULATORY_LIAISON_AUTHORITY` | **HELD_FOR_ALPHA** per **CCR-2026-003** — Modules 40-41 BLOCKED_BY_DESIGN in Alpha; 0 alpha_required bindings consume it (PR-audit confirmed) | CANONICAL via CCR-2026-003 |
| `BORROWER_INTAKE_REVIEWER` | A5 Borrower Escalation Authority — Stuart | CANONICAL (runbook explicit) |
| `DOCUMENT_VERIFICATION_REVIEWER` | A5 Borrower Escalation Authority — **Stuart** | CONFIRMED via **AAR-2026-002** (ASSUMED tag dropped; scope = borrower-document completeness/escalation only) |
| `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER` | **HELD_FOR_ALPHA** per **CCR-2026-002** — environmental review deferred; Stuart not qualified; Caitlin holds qualification but is the builder | CANONICAL via CCR-2026-002 (regulated-competency SPOF flagged for successor plan) |
| `SOURCE_LEGAL_AUTHORITY` | **HELD_FOR_ALPHA** per **CCR-2026-004** — source legal/licensing review and source promotion held in Alpha; 0 alpha_required bindings consume it (PR-audit confirmed) | CANONICAL via CCR-2026-004 |
| `CREDIT_ELIGIBILITY_AUTHORITY` | EXTERNAL — lender / agency | CANONICAL (runbook explicit) |
| `SOVEREIGN_FEDERATION_AUTHORITY` | UNFILLED_BY_DESIGN_FOR_ALPHA — no sovereign customer in Alpha cohort (CANON-SOVEREIGNTY-001) | CANONICAL (Public Alpha Definition §9 implies no sovereign in Alpha) |
| `THIRD_PARTY_RECORDS_AUTHORITY` | EXTERNAL — third-party records (county recorder, title, etc.) | ASSUMED |

**Communications Authority (A6, Frances)** has no direct Module 45 role mapping today — it is a functional authority that oversees notice content; the underlying notice-related bindings clear under `GOVERNANCE_OPERATOR` per the Module 45 registry. Frances therefore exercises authority over A6 functionally, but does not directly clear a Module 45 binding labeled "Communications." This is recorded for completeness.

---

## 7. Notes for the Independent Reviewer

- Active-fill assignments above include **placeholder effective dates**. The named governance authority records the actual date at Ceremony Part D and the access-control layer reflects that record.
- All ASSUMED mappings should be confirmed by Stuart + Frances at exception review per VIA-AUDIT-EXCEPTION-001. If any mapping changes, this Annex is updated, the JSON mirror is regenerated, and the build-preservation archive checksums the new version.
- Per VIA-GOVERNANCE-CLASSIFICATION-001, any change to a role's classification (e.g. moving `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER` from ASSUMED-active to HELD) shall be recorded as a new CCR entry — not silently changed.
