# Public Alpha Surface Content v1

**Doctrine status:** PROPOSED.
**Audience:** authors of the seven customer-facing entry surfaces; the Build 41 audit (`verify:customer-journey`).
**What this is:** the canonical visible-on-render text that each of the seven Public Alpha customer-facing routes shall carry. The Build 41 verifier audits each `page.tsx` against the registry in `src/lib/customer-journey/publicAlphaSurfaceContent.ts` — which is a structured mirror of this document. The two MUST stay in sync; if they drift, this document is authoritative.
**What this is NOT:** new doctrine. Every block below is a synthesis or direct quotation of already-codified doctrine:
- `docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md` — foundational principle, ten "will do", twelve "will not do", four-stage escalation, plain-English requirement.
- `docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md` — eight canonical disclosures + applies-to surface classes.
- `docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md` — §1 advisory posture, §3 ON, §4 OFF.
- `docs/DOCTRINE_PUBLIC_ALPHA_CUSTOMER_JOURNEY_V1.md` — 7 entry-surface sections, 6 customer success questions, customer promise (tagline + 5 negations + 6 affirmations), 6 financing reality classifications.
- `docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md` — 12 roles, "we facilitate, we do not decide."
- `docs/CUSTOMER_TRUST_PROFILE_V1.md` — synthesized customer-facing language for the nine topics.

**Rendering rule:** disclosures listed under each route MUST appear visible-on-render — present in the initial paint without requiring a click, tab change, expand, or scroll-into-view. This rule mirrors Module 44's `placement: visible-on-render` field.

---

## Route 1 — `/about` (Founder Introduction)

Per Customer Journey Doctrine §1 (Founder Introduction). Establish trust, explain mission, explain platform limitations.

### Required visible-on-render content

**Tagline (verbatim):**
> Compass to Capital

**Founder mission paragraph (synthesized from Customer Trust Profile §Foundational Principle + Public Alpha Definition §1):**
> Furlong exists to help people understand their options before they commit significant time, money, effort, or personal information to a path. We are a compass, not a lender. Every decision that affects you is cleared by a named, credentialed human; no AI clears anything; no one clears their own request.

**Customer Promise — the 5 negations (verbatim from Customer Journey Doctrine §Customer Promise):**
> Furlong does not:
> - approve loans
> - deny loans
> - issue underwriting decisions
> - issue agency determinations
> - guarantee funding

**Customer Promise — the 6 affirmations (verbatim from Customer Journey Doctrine §Customer Promise):**
> Furlong helps users understand:
> - available pathways
> - readiness gaps
> - documentation needs
> - financing realities
> - environmental considerations
> - next recommended actions
>
> — before significant time, money, or effort are committed.

### Required Module 44 disclosures (visible-on-render)
- `advisory-only`
- `no-reliance`
- `furlong-not-lender`
- `user-data-sovereignty`

### Banned tokens
None specific to this surface beyond the Module 44 prohibited-claims corpus.

---

## Route 2 — `/trust` (Trust Posture)

Per Customer Trust Profile + Data Transparency Doctrine. The full long-form trust statement.

### Required visible-on-render content

**Foundational principle (verbatim from Data Transparency Doctrine §Foundational Principle):**
> Your information belongs to you. Not to Furlong. Not to lenders. Not to brokers. Not to advertisers. Not to data aggregators.

**The ten "Furlong will" obligations (verbatim from Data Transparency Doctrine §What Furlong Will Do):**
> Furlong will:
> - Explain why information is requested.
> - Explain how information is used.
> - Explain which recommendations relied upon specific information.
> - Explain when additional information is needed.
> - Explain when information is shared.
> - Explain when information is retained.
> - Explain when information can be deleted.
> - Explain when information can be exported.
> - Preserve evidence lineage and recommendation traceability.
> - Allow users to understand how conclusions were reached.

**The twelve "Furlong will not" prohibitions (verbatim from Data Transparency Doctrine §What Furlong Will Not Do):**
> Furlong will not:
> - Sell user information.
> - Secretly submit user information to lenders.
> - Secretly submit user information to agencies.
> - Secretly submit user information to brokers.
> - Secretly distribute user information to third parties.
> - Generate undisclosed marketing leads.
> - Hide recommendation logic.
> - Hide pathway exclusions.
> - Hide readiness limitations.
> - Hide known conflicts.
> - Hide known risks.
> - Represent user information as verified when it has not been verified.

**Trust principle (verbatim from Data Transparency Doctrine §Trust Principle):**
> Trust is not created by collecting information. Trust is created by explaining what is happening and why. Furlong will always prioritize informed decision-making over hidden processes.

### Required Module 44 disclosures (visible-on-render — all eight)
- `advisory-only`
- `no-reliance`
- `no-public-verification`
- `furlong-not-lender`
- `ai-tier1-only`
- `data-rights`
- `free-for-borrowers`
- `user-data-sovereignty`

---

## Route 3 — `/data-rights` (Data Transparency & Customer Rights)

Per Customer Journey Doctrine §7 (Data Transparency) + Data Transparency Posture Runtime v1 (the five customer rights).

### Required visible-on-render content

**Foundational statement (verbatim from Data Transparency Doctrine §Foundational Principle):**
> Your information belongs to you.

**What information is collected, why, how it is used, what has been shared, what has not been shared (per Customer Journey Doctrine §7 — the five mandatory items).** Each section labeled in plain English, no legal-document review required.

**The five customer rights (verbatim from Data Transparency Posture Runtime v1):**
> You may, at any time, exercise any of these without giving a reason:
>
> - **REQUEST_EXPLANATION** — "Tell me why I'm seeing this and what it relied on."
> - **REQUEST_DELETION** — "Delete what you have about me."
> - **REQUEST_EXPORT** — "Give me a copy of what you have about me, in a usable form."
> - **REQUEST_HUMAN_REVIEW** — "Have a human look at this before it goes anywhere."
> - **REQUEST_HOLD_ON_ESCALATION** — "Don't move my information to the next stage yet."

**Deletion language (REQUIRED — must match Data Transparency Doctrine §What Furlong Will Do, item 7):**
> When you request deletion, Furlong will delete your information from the live system, preserve only the audit log required for regulatory traceability, and confirm what happened. We will explain when information can be deleted and what we keep for traceability.

### Required Module 44 disclosures (visible-on-render)
- `advisory-only`
- `data-rights`
- `user-data-sovereignty`
- `free-for-borrowers`

---

## Route 4 — `/financing-pathways` (Pathway Discovery + Financing Reality Classification)

Per Customer Journey Doctrine §3 (Pathway Discovery) + §5 (Financing Reality Classification). **No approval language permitted (§3).**

### Required visible-on-render content

**Pathway discovery framing (per Customer Journey Doctrine §3 — present three categories):**
- **Likely pathways** — pathways the customer's project may qualify for, advisory only.
- **Excluded pathways** — pathways the customer's project does NOT qualify for, with the **rationale**.
- **Rationale** — plain-English explanation of why a pathway is included or excluded.

**The 6 financing reality classifications (verbatim from Customer Journey Doctrine §5):**
> Each pathway is classified as one of:
>
> - likely financeable
> - financeable with conditions
> - specialist review required
> - limited financing market
> - cash-favored transaction
> - not enough information

### Required Module 44 disclosures (visible-on-render)
- `advisory-only`
- `no-reliance`
- `furlong-not-lender`
- `ai-tier1-only`

### Banned tokens (per Customer Journey Doctrine §3 "No approval language permitted")
The surface MUST NOT contain any of the following unexempted-by-negation matches:
- `you are approved`
- `you qualify`
- `guaranteed (approval | funding | rate | loan)`
- `pre-approved`

(Module 44 enforces the broader prohibited-claims corpus across all surfaces; these are the §3-specific must-not patterns.)

---

## Route 5 — `/readiness` (Readiness Review)

Per Customer Journey Doctrine §4 (Readiness Review). Present readiness indicators, missing items, documentation recommendations.

### Required visible-on-render content

**Three section headers (in order):**
- **Readiness indicators** — the signals the system computed (advisory).
- **Missing items** — what the customer still needs to provide.
- **Documentation recommendations** — the documents we recommend the customer prepare.

**Plain-English explanation per item.** Each indicator carries a "why this matters" sentence.

**Human review notice:**
> Every readiness assessment is advisory. A named credentialed reviewer can review your readiness with you on request.

### Required Module 44 disclosures (visible-on-render)
- `advisory-only`
- `no-reliance`
- `data-rights`

---

## Route 6 — `/onboarding` (Customer Project Intake)

Per Customer Journey Doctrine §2 (Customer Project Intake). Simple guided intake.

### Required visible-on-render content

**Four intake questions (verbatim from Customer Journey Doctrine §2):**
- What type of business do you own?
- What are you trying to accomplish?
- Where is the property located?
- What type of asset is involved?

**Plain-English framing (paraphrasing Customer Trust Profile §Topic 7 + §Topic 9):**
> We ask only what we need to give you guidance. You may stop at any time, request deletion, or request human review.

### Required Module 44 disclosures (visible-on-render)
- `advisory-only`
- `data-rights`
- `user-data-sovereignty`
- `free-for-borrowers`

---

## Route 7 — `/portal/borrower` (Human Escalation)

Per Customer Journey Doctrine §6 (Human Escalation) + Data Transparency Doctrine §Escalation Control.

### Required visible-on-render content

**The four-stage escalation, customer-controlled (verbatim from Data Transparency Doctrine §Escalation Control):**
> Users decide when information moves from:
>
> Exploration → Human Review → Lender Engagement → Application Submission.
>
> Furlong may recommend escalation but will not silently perform escalation.

**Available human review paths** (per Customer Journey Doctrine §6) — each labeled with the reviewer role, sourced from the Vol VII Operational Annex:
- **Borrower intake** — Borrower Intake Reviewer
- **Document review** — Document Verification Reviewer
- **Independent governance review** — Qualified Governance Reviewer
- **Data-rights fulfillment** — Data Rights Officer
- **Final authority decisions** — Chief Governance Authority

**Authority assignments (sourced from `docs/governance/VOL_VII_OPERATIONAL_ANNEX.json`):**
> Each escalation lands on a named, credentialed human. Names are recorded in the Vol VII Operational Annex and surfaced on request via REQUEST_HUMAN_REVIEW.

**Next-step guidance (per Customer Journey Doctrine §6):**
> Whatever you do next is your decision. We will tell you what we recommend, what the trade-offs are, and what the next stage requires.

### Required Module 44 disclosures (visible-on-render)
- `advisory-only`
- `furlong-not-lender`
- `ai-tier1-only`

---

## Verification (Build 41 gate `verify:customer-journey`)

The Build 41 CLI reads each route's `page.tsx` from disk and audits:

1. **Route loads** — the `page.tsx` exists.
2. **Required content tokens** — the canonical tokens for that route (founder mission, customer promise negations/affirmations, the 6 financing reality classifications, the 5 customer rights, the four-stage escalation, etc.) are present.
3. **Module 44 disclosures** — the route is recognized by the disclosure audit (`composeDisclosureAuditGate`) and carries every required disclosure_id for its surface class.
4. **Banned tokens** — `/financing-pathways` does not contain unexempted-by-negation approval language.
5. **Deletion-language match** — `/data-rights` deletion language matches the verbatim block above.

PASS only when all 7 routes pass all 5 checks. Until then the gate fail-closes with an audit-traced finding per gap.

---

## Constitutional posture

- Internal advisory audit posture only.
- No new doctrine introduced — every block above is sourced.
- Replay-safe: same commit + same registry → same audit.
- Audit-safe: every finding carries route, check, redacted reason.
- Per-route doctrine traceability: every required content block carries its source doctrine in the registry.
- Aligns with Module 44 visible-on-render placement, Module 45 named human authority, and the Customer Trust Profile.
