# Authority Assignment Registry

Records corrections/changes to **who holds** a Module 45 role (the holder), as distinct from changes to a role's **classification** (which live in the Classification Change Registry). Role-holder names mirror the Volume VII Operational Annex.

---

## AAR-2026-001 — QUALIFIED_GOVERNANCE_REVIEWER holder correction

### Role
`QUALIFIED_GOVERNANCE_REVIEWER` — classification unchanged: **ACTIVE_FILL** (this is a holder correction, not a reclassification).

### Previous Holder
Caitlin Hudson — **ASSUMED** during Step-3 Annex projection.

### New Holder
Stuart Fraass.

### Reason for Change
Volume VII Part 7 defines Internal Independent Review as performed by "a reviewer with **no role in building the control**." Caitlin is the primary builder / Technical Infrastructure Steward (VIA-STEWARD-004), so she cannot hold an independent governance-review role. Stuart has no role in building controls and therefore satisfies the independence standard.

This assignment does **not** violate VIA-AUDIT-001: the control-verification tiers — Independent Verification Authority and Audit Certification Authority — are **separate roles and remain UNFILLED / pending**. The builder still does not self-verify any control; Production Certification remains BLOCKED_BY_DESIGN.

### Guardrail (scope boundary — must confirm before commit)
`QUALIFIED_GOVERNANCE_REVIEWER` **may** review: governance records, role mappings, exception entries, classification changes, and ceremony compliance.

`QUALIFIED_GOVERNANCE_REVIEWER` **may not** perform: control verification, build verification, audit certification, technical attestation, environmental engineering review, or production certification.

If runtime permissions include **any** verification or certification authority, this role must be reclassified as **UNFILLED / pending Independent Verification Authority** (log as a CCR; expect the gate to flip to exit 1, covered by VIA-AUDIT-EXCEPTION-001). The assignment to Stuart is valid **only if** the runtime scope matches the "may review / may not perform" boundary above.

### Governance Authority Approving Change
Founder Governance Review (2-of-3); independent review per VIA-AUDIT-EXCEPTION-001 (Stuart + Frances).

### Effective Date
_[recorded at ceremony]_

### Doctrine Trace
Vol VII Part 7 (Certification & Independent Verification); VIA-AUDIT-001/002; VIA-STEWARD-004 exclusions.

---

## AAR-2026-001 Scope Confirmation Appendix (audit at issuance)

The current `QUALIFIED_GOVERNANCE_REVIEWER` Module 45 bindings have been enumerated and audited against the "may review / may not perform" boundary above. **One** binding sits at the boundary; the rest are clean review-scope.

| Binding | Action | Within "may review"? | Resolution |
|---|---|---|---|
| `auth-applications-review-transition` | transition application status | ✅ review | OK — alternate clearer GOVERNANCE_OPERATOR (Caitlin) also available |
| `auth-reviews-transition` | transition human review state | ✅ review | OK — Stuart-only; review scope |
| **`auth-audit-replay-verify`** | **verify audit replay integrity** | ⚠️ **CONTROL VERIFICATION** | **Per AAR guardrail Stuart shall NOT perform.** Binding's alternate `required_role` is `GOVERNANCE_OPERATOR` (Caitlin) → Caitlin clears internally under **VIA-AUDIT-EXCEPTION-001**, labeled "Internally Verified — Independent Verification Pending." Stuart never performs this clear. The role assignment to Stuart stays valid. |
| `auth-governance-posture-review` | record governance posture review | ✅ governance records review | OK — co-clear with CHIEF_GOVERNANCE_AUTHORITY |
| `auth-borrower-onboarding-core-v2-review` | review BO v2 composition + handoffs | ✅ composition review | OK |
| `auth-readiness-assessment-v2-review` | review RA v2 composition | ✅ | OK |
| `auth-opportunity-discovery-v2-review` | review OD v2 composition | ✅ | OK |
| `auth-financing-pathway-engine-v2-review` | review FPE v2 composition | ✅ | OK |
| `auth-revenue-intelligence-v2-review` | review RI v2 composition | ✅ | OK |
| `auth-capital-graph-review` | review capital graph composition | ✅ | OK |
| `auth-customer-type-registry-review` | review customer type registry composition | ✅ | OK |
| `auth-recommendation-precision-harness-review` | review precision-harness output | ✅ review of output | OK |
| `auth-evidence-resolution-workflow-review` | process clarification request | ✅ | OK — co-clear with BORROWER_INTAKE_REVIEWER (Stuart) |
| `auth-document-evidence-reconciliation-review` | process reconciliation finding | ✅ | OK |
| `auth-data-transparency-posture-review` | review transparency posture audit | ✅ review of audit (not certification) | OK |
| `auth-build-self-report-review` | review build self-report audit | ✅ review of audit (not certification) | OK |

### Conclusion
AAR-2026-001 stands. Stuart Fraass holds `QUALIFIED_GOVERNANCE_REVIEWER`. The single boundary case (`auth-audit-replay-verify`) is handled by the binding's alternate clearer routing under VIA-AUDIT-EXCEPTION-001 — no role-level reclassification required.

Any future binding added to `QUALIFIED_GOVERNANCE_REVIEWER` MUST be re-audited against this boundary. If a new binding requires verification or certification scope and has no alternate clearer, log a CCR and reclassify QGR as UNFILLED / pending IVA per the AAR guardrail.

---

## AAR-2026-002 — DOCUMENT_VERIFICATION_REVIEWER scope confirmation (drop ASSUMED tag)

### Role
`DOCUMENT_VERIFICATION_REVIEWER` — classification unchanged: **ACTIVE_FILL**. This entry records a scope confirmation, not a holder change.

### Holder
Stuart Fraass.

### Reason for Entry
The Step-3 Annex projection assigned this role to Stuart with an ASSUMED tag pending scope audit. PR-review audit at Build 39 confirms the scope is borrower-document completeness/escalation only — no control verification, no audit certification, no production certification. The role therefore fits comfortably within the AAR-2026-001 "may review" boundary as it applies to borrower-side escalation domain.

### Scope Audit
| Binding | Action | Boundary fit |
|---|---|---|
| `auth-document-evidence-reconciliation-review` | process document evidence reconciliation finding | ✅ completeness/escalation review |
| `auth-portal-borrower-documents-review` | review borrower documents portal posture | ✅ posture review |

### Outcome
- Stays **ACTIVE_FILL → Stuart Fraass**.
- **ASSUMED tag dropped.** The mapping is recorded as CONFIRMED in the Vol VII Operational Annex.
- No CCR required — the role classification is unchanged.
- Per Vol VII Part 7, if any future binding adds control-verification or audit-certification scope to this role, re-audit per AAR-2026-001 guardrail.

### Doctrine Trace
Vol VII Part 7 (Certification & Independent Verification); AAR-2026-001 (Stuart's review-scope boundary); VIA-AUDIT-001 (independence not required at completeness-review tier).
