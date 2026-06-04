# Build 38 — Public Alpha Profile v1

**Doctrine:** `docs/DOCTRINE_PUBLIC_ALPHA_CUSTOMER_JOURNEY_V1.md` (the user-issued Public Alpha Profile v1 spec, preserved verbatim)
**Companion synthesis:** `docs/CUSTOMER_TRUST_PROFILE_V1.md`
**Runtime:** `src/lib/public-alpha-journey/publicAlphaCustomerJourneyRuntime.ts`
**Runtime version:** `public-alpha-customer-journey-runtime-v0.1.0`
**Spec version:** `public-alpha-profile-v1`
**Module:** `governance-public-alpha-customer-journey` · **Route:** `/governance/public-alpha-customer-journey`
**API:** `POST /api/governance/public-alpha-customer-journey`
**Foundation (DoD #5):** Build 38 foundation — A7 cross-source conflicts driven to zero (commit `55f66eb`).

---

## What Build 38 ships

The first canonical governed audit of the Public Alpha customer journey. Validates the platform's first controlled exposure to real users against the spec's 7 entry-surface sections, 6 customer success criteria, customer promise, financing reality classifications, Module 44 disclosure coverage, and Module 45 human-authority bindings.

Build 38 has two layers, merged separately:

| Layer | Commit / PR | What it does |
|---|---|---|
| **Foundation** (DoD #5) | `55f66eb` / PR #27 | Fixes the `pii_redaction` semantic bug + enumerates the 3 pending Master Volume requirements so the Build Self-Report exits 0 for Alpha-required modules. |
| **Customer journey runtime** (this PR) | this PR | Codifies the Public Alpha Profile v1 spec into a governed runtime. |

---

## Spec → runtime mapping

| Spec section | Runtime symbol |
|---|---|
| **Public Alpha Objectives** (7) | Encoded as the 6 governed signals + the 8 finding categories on the runtime |
| **Public Alpha Customer Promise** | `CUSTOMER_PROMISE_TAGLINE` ("Compass to Capital"), `CUSTOMER_PROMISE_NEGATIONS` (5), `CUSTOMER_PROMISE_AFFIRMATIONS` (6) |
| **Public Alpha Entry Surface §1-§7** | `PUBLIC_ALPHA_CUSTOMER_JOURNEY_SECTIONS` (7 sections with ordinal, candidate routes, required tokens, required disclosure IDs, required authority binding, banned tokens) |
| **§3 "No approval language permitted"** | `pathway_discovery.bannedSemanticTokens` (rejects "you are approved", "you qualify", "guaranteed approval", "pre-approved") |
| **§5 Financing Reality Classification** | `FINANCING_REALITY_CLASSIFICATIONS` (6 — likely-financeable / with-conditions / specialist-review / limited-market / cash-favored / not-enough-info) |
| **Alpha Success Criteria** (6 questions) | `PUBLIC_ALPHA_CUSTOMER_SUCCESS_QUESTIONS` (6, each mapped to the sections that answer it) |
| **Constitutional Posture** | Full flag set: `productionBlocked`, `humanReviewRequired`, `advisoryOnly`, `publicAlphaCustomerJourneyInternalOnly`, `noCustomerFacingPublication`, `noAutonomousDetermination`, `noApproval`, `noDenial`, `noLenderCommitment`, `noLegalReliance`, `noPublicVerification`, `noRegulatoryReliance`, `noLiveExternalAction`, `noNoticeSend`, `replaySafe`, `auditSafe`, `federationScoped`, `conflictPreserving` |
| **Definition of Done #1** | Doctrine documented at `docs/DOCTRINE_PUBLIC_ALPHA_CUSTOMER_JOURNEY_V1.md` (and synthesized at `docs/CUSTOMER_TRUST_PROFILE_V1.md`) |
| **Definition of Done #2** | Operational — access-control records role fills (Ceremony Part C from the prior sign-off template) |
| **Definition of Done #3** | Disclosure Audit Gate `verify:disclosures` already exits 0 (Build 37) |
| **Definition of Done #4** | Human Authority Registry validated; exits 0 once roles are filled (Build 36 + operational) |
| **Definition of Done #5** | Build Self-Report exits 0 for Alpha-required modules (Build 38 foundation, merged) |
| **Definition of Done #6** | Customer journey validated through smoke testing — this build's `smoke:public-alpha-customer-journey` |
| **Definition of Done #7** | Customer-facing entry surface available — the 7 routes (`/about`, `/onboarding`, `/financing-pathways`, `/readiness`, `/portal/borrower`, `/data-rights`, `/trust`) all load; the runtime surfaces remaining content gaps for closure |

---

## The 6 governed signals

| Signal | What it asserts |
|---|---|
| `customer_journey_section_coverage` | All 7 entry-surface sections load, carry required tokens, carry required disclosures, and (where escalation-capable) have a Module 45 binding. |
| `customer_promise_alignment` | The Compass-to-Capital tagline + 5 negations + 6 affirmations are present on the founder/trust surfaces. |
| `customer_success_criteria_coverage` | Each of the 6 customer questions (What are my options / risks / docs / data / next / who can help me) is answerable via passing sections. |
| `disclosure_visibility_alignment` | Each section's surface carries every required Module 44 disclosure for its surface class. |
| `escalation_assignment_alignment` | Every escalation-capable section's underlying module has a Module 45 named-role binding. |
| `financing_reality_classification_alignment` | All 6 financing reality classifications appear on the financing-pathways surface. |

---

## The 8 finding categories

`SECTION_ROUTE_MISSING`, `SECTION_REQUIRED_TOKEN_MISSING`, `SECTION_BANNED_TOKEN_PRESENT`, `SECTION_DISCLOSURE_MISSING`, `SECTION_HUMAN_AUTHORITY_BINDING_MISSING`, `CUSTOMER_PROMISE_INCOMPLETE`, `FINANCING_REALITY_CLASSIFICATION_MISSING`, `CUSTOMER_SUCCESS_QUESTION_UNANSWERED`. Every finding resolves to `REQUIRES_HUMAN_REVIEW`.

---

## The `alpha_journey_ready` gate

| Value | Meaning |
|---|---|
| `PASS` | Every section passes, every success question is answerable, customer promise is complete, all 6 financing classifications are present, no findings outstanding. |
| `PENDING_SIGNOFF` | Sections + success questions structurally clear but the customer promise or classifications carry warnings — awaits surface-content closure. |
| `FAIL` | At least one section fails, a customer question is unanswerable, or the customer promise/classifications are missing. |

Per Build 38 foundation: `verify:human-authority` and `verify:customer-journey` are intentionally honest. They exit `1` until (a) the access-control layer records the Ceremony Part C role fills *and* (b) the 7 customer-facing surface pages carry the doctrine text the spec requires. The runtime *is* the artifact; the operational closures land separately, exactly as Module 45 ships before access-control records role fills.

---

## Baseline audit at issuance

```
sections (PASS/FAIL): 0 / 7      ← surfaces exist; doctrine text not yet on them
customer success questions (PASS/FAIL): 0 / 6
customer promise: WARN           ← Compass-to-Capital + 5 negations + 6 affirmations not yet on /about
financing reality classifications: 0 / 6   ← not yet on /financing-pathways
findings: 19
cross-source conflicts: 2 (disclosure mismatch + authority binding mismatch)
alpha_journey_ready: FAIL
exit_code: 1
```

This is the **correct** honest baseline — same posture as Module 45 reporting FAIL until access-control records roles. The runtime surfaces every gap explicitly; future builds close them by adding doctrine text to the 7 customer-facing surfaces.

---

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run smoke:public-alpha-customer-journey` | PASS (7 sections / 6 questions / 6 classifications / 5 negations / 6 affirmations / 15 handoffs / 0 cross-source conflicts in the structural assertions) |
| `npm run verify:customer-journey` | exit 1 — honest baseline (doctrine text not yet on customer surfaces; same posture as `verify:human-authority` pre-Ceremony) |
| `npm run smoke:build-self-report` | PASS (0 cross-source conflicts; foundation A7 fix held) |
| `npm run smoke:human-authority-registry` | PASS |
| `npm run smoke:disclosure-audit-gate` | PASS |
| `npm run smoke:public-alpha-profile` | PASS (Build 35 — still PENDING_SIGNOFF as designed) |
| `npm run verify:module-manifests` | PASS (103 modules, highest=45, sequence contiguous, 27 public surfaces, 591 handoffs, 93 event contracts) |
| `npm run smoke:cross-module-replay` | PASS |
| `npm run build` | PASS |

---

## What still needs to happen for Public Alpha to actually open

1. **Ceremony Part C** — access-control records the 7 alpha-required role fills (Chief Governance Authority, Qualified Governance Reviewer, Governance Operator, Data Rights Officer, Borrower Intake Reviewer, Document Verification Reviewer, Environmental Engineering Spoke Reviewer).
2. **Surface-content closure** — add the founder introduction + customer promise to `/about` and `/trust`; add the 6 financing reality classifications to `/financing-pathways`; add the readiness review language to `/readiness`; add the intake questions to `/onboarding`; add the human escalation language to `/portal/borrower`; add the data transparency language to `/data-rights`.
3. **Re-run** `verify:human-authority` → exit 0; `verify:customer-journey` → exit 0; `smoke:public-alpha-profile` → `alpha_entry_allowed = PASS`.
4. **Named governance authority** signs the Sign-Off Ceremony Part D (the line the runtime reads).
5. **Build-preservation archive** checksums the signed record + the green self-report into the canonical evidence pack.

Each step is operationally explicit and machine-verifiable. The Build 38 runtime is the audit that confirms each step landed correctly.

---

## Constitutional posture preserved

- No customer-facing publication. The runtime audits; it does not publish.
- No Alpha entry authorization. The runtime reports; the named governance authority decides.
- No autonomous determination of any kind. No approval, denial, decision, certification, verification, commitment.
- Replay-safe + audit-safe + conflict-preserving + federation-scoped + production-blocked.
- Every finding resolves to `REQUIRES_HUMAN_REVIEW`.
- `internal-governance` claims profile.

---

*Together with Build 34 (Module 42 Build Self-Report), Build 35 (Public Alpha Profile), Build 36 (Module 45 Human Authority Registry), Build 37 (Module 44 Disclosure Audit Gate), and the Build 38 foundation (A7 conflicts to zero), Build 38 completes the canonical Public Alpha Profile v1 audit chain. With the Ceremony Part C role fills and the surface-content closure, Public Alpha is approvable.*
