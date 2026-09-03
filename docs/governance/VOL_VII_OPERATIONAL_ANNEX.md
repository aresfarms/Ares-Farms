# Volume VII - Operational Annex (Owner-Controlled Transition)

**Status:** Active transition posture as of 2026-09-03.
**Machine-readable mirror:** `docs/governance/VOL_VII_OPERATIONAL_ANNEX.json`.
**Superseding transition record:** `docs/governance/OWNER_CONTROLLED_PLATFORM_TRANSITION_2026-09-03.md`.

This Annex records who or what clears current Furlong operational roles. Personal partner access does not create platform ownership or governance authority. Independent-review duties remain separate from the owner's implementation duties and fail closed while no qualified independent reviewer is appointed.

## 1. Current Active-Fill Authorities

| # | Authority | Holder | Status | Quorum / boundary |
|---|---|---|---|---|
| A1 | Governance Authority | Caitlin Hudson | ACTIVE | Owner for ordinary operations; independent reviewer additionally required where separation-of-duties applies |
| A2 | Compliance Authority | Caitlin Hudson | ACTIVE | Operational oversight only; independent certification remains separate |
| A3 | Data Rights Authority | Caitlin Hudson | ACTIVE | 1 |
| A4 | Capital & Financing Coordination Authority | Furlong Capital Desk | ACTIVE | Coordination only; final credit authority remains external |
| A5 | Borrower Escalation Authority | Caitlin Hudson | ACTIVE | Borrower intake/document-completeness operations only |
| A6 | Communications Authority | Furlong Trust Desk | ACTIVE | Role queue; no person-bound governance authority |
| A7 | Public Trust / Disclosure Authority | Furlong Trust Desk | ACTIVE | Role queue; material public claims remain governance-gated |

## 2. Independent and Held Authorities

`QUALIFIED_GOVERNANCE_REVIEWER` is **UNFILLED_BY_DESIGN** pending appointment of an independent reviewer. The owner may not self-clear an independent-review obligation.

Independent Verification Authority, Audit Certification Authority, and Build Verification Authority remain unfilled/pending under the existing internal-verification exception. Deployment and institutional-treasury authorities remain separately gated until their activation conditions are met.

## 3. External Authorities

| Authority | Holder | Rule |
|---|---|---|
| Credit / Eligibility Authority | Lender / agency | Never Furlong and never AI |
| Third-Party Records Authority | Applicable recorder, title office, agency, or other authoritative source | External evidence authority |

An external broker workspace may remain available as a professional spoke. Workspace access does not satisfy any Furlong governance, audit, treasury, release, source-legal, public-trust, or independent-review role.

## 4. Module 45 Traceability

| Module 45 role | Current posture |
|---|---|
| `CHIEF_GOVERNANCE_AUTHORITY` | A1 - Caitlin Hudson; independent review still required where constitutionally triggered |
| `GOVERNANCE_OPERATOR` | A1 - Caitlin Hudson for day-to-day operations |
| `QUALIFIED_GOVERNANCE_REVIEWER` | UNFILLED_BY_DESIGN pending independent appointment |
| `DATA_RIGHTS_OFFICER` | A3 - Caitlin Hudson |
| `BORROWER_INTAKE_REVIEWER` | A5 - Caitlin Hudson |
| `DOCUMENT_VERIFICATION_REVIEWER` | A5 - Caitlin Hudson; completeness/escalation only |
| `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER` | HELD until activated and a qualified reviewer is assigned |
| `REGULATORY_LIAISON_AUTHORITY` | HELD until regulatory examination/response capabilities activate |
| `SOURCE_LEGAL_AUTHORITY` | HELD until source-promotion/legal-review path activates |
| `CREDIT_ELIGIBILITY_AUTHORITY` | EXTERNAL - lender / agency |
| `SOVEREIGN_FEDERATION_AUTHORITY` | UNFILLED_BY_DESIGN until a sovereign customer requires it |
| `THIRD_PARTY_RECORDS_AUTHORITY` | EXTERNAL |

## 5. Historical lineage

Earlier ceremonies, build records, deployment evidence, signed attestations, and immutable audit artifacts may contain the names of people who actually acted at the time. Those records remain historical evidence and do not confer current authority.

Current authority is determined only from this Annex, its JSON mirror, the human-authority runtime, and later properly recorded superseding entries.

## 6. Hard transition rule

No former partner, external broker, contractor, or communications participant is a required dependency for Furlong Core. Optional professional spokes must degrade gracefully, and disabling one must not prevent Furlong from continuing borrower intelligence, document readiness, program navigation, environmental coordination, lender routing, or other core governed workflows.
