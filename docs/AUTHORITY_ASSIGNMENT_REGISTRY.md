# Authority Assignment Registry

Records the current holder posture for Module 45 roles. Historical holder assignments remain recoverable from immutable build evidence and git history; superseded personal assignments are not carried forward into the active registry.

## AAR-2026-003 - Owner-Controlled Authority Reconstitution

**Status:** ACTIVE
**Effective date:** 2026-09-03
**Authority:** Owner-controlled platform transition; see `docs/governance/OWNER_CONTROLLED_PLATFORM_TRANSITION_2026-09-03.md`.

### Purpose

Remove former person-bound governance dependencies while preserving separation of duties and fail-closed independent review. External professional portal access is not an authority assignment.

### Current assignments

| Role | Current holder/posture | Scope |
|---|---|---|
| `CHIEF_GOVERNANCE_AUTHORITY` | Caitlin Hudson | Platform governance; independent review required where constitutionally triggered |
| `GOVERNANCE_OPERATOR` | Caitlin Hudson | Day-to-day governed operations |
| `DATA_RIGHTS_OFFICER` | Caitlin Hudson | Data-rights operations |
| `BORROWER_INTAKE_REVIEWER` | Caitlin Hudson | Borrower intake review |
| `DOCUMENT_VERIFICATION_REVIEWER` | Caitlin Hudson | Borrower-document completeness and escalation only |
| `QUALIFIED_GOVERNANCE_REVIEWER` | UNFILLED_BY_DESIGN | Must be independent of the control builder for independent-review work |
| `CREDIT_ELIGIBILITY_AUTHORITY` | EXTERNAL - lender / agency | Credit and program eligibility decision authority |

### Independence boundary

The platform owner may perform internal implementation verification during development under the documented exception, but may not represent that work as independent verification, external audit certification, or production certification.

Any future independent reviewer must be identity-bound, qualified for the assigned scope, conflict-screened, and recorded before clearing a role that requires independence.

### External broker workspace

The retained broker workspace is an optional professional-spoke access path. It confers no current Furlong authority assignment and does not clear any Module 45 governance role.

### Supersession rule

All earlier person-bound authority assignments inconsistent with AAR-2026-003 are superseded for current operation. Historical records are retained as evidence only and must not be used by runtime authorization as proof of current authority.
