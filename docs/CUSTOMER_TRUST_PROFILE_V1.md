# Furlong — Customer Trust Profile v1

**Doctrine status:** PROPOSED (assembled from existing canonical doctrine — no new commitments)
**Audience:** customers (borrowers, farmers, partners) and anyone auditing the platform's posture.
**What this is:** the one-page statement of what Furlong promises you, why, and how you can verify it. Every line below is anchored to an already-codified doctrine in `docs/DOCTRINE_*` and a Master Volume requirement code; nothing here is new.
**What this is not:** marketing copy. It is a synthesis of existing doctrine, written in plain English so you can read it without legal, financial, regulatory, or technical training. (`Data Transparency & User Sovereignty Doctrine — Plain English Requirement`.)
**How to inspect this profile yourself:**
- `npm run verify:disclosures` — every required disclosure on every surface must be present.
- `npm run verify:human-authority` — every clearable action must be bound to a named human.
- `npm run build:self-report` — the platform's own per-module audit.

---

## The foundational principle (the line everything else holds to)

> **Your information belongs to you. Not to Furlong. Not to lenders. Not to brokers. Not to advertisers. Not to data aggregators.**

— `docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md` §"Foundational Principle"

Furlong may *process* your information to give you guidance — readiness assessments, pathway recommendations, opportunity discovery, document organization, environmental review, advisory services — but **ownership remains with you**. (Same source.)

---

## 1 — Data ownership

**What we promise.** Your information is yours. We hold it under your authority, not the other way around. We do not sell it, secretly submit it to anyone, or distribute it to third parties.

**Where this comes from.**
- *Data Transparency & User Sovereignty Doctrine* §"Foundational Principle" and §"What Furlong Will Not Do" — `docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md`.
- *Disclosure Audit Gate* canonical disclosure `user-data-sovereignty`: *"You remain in control of when your information moves from exploration to engagement. Furlong does not secretly submit, sell, or distribute your information."* — `docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md` §2 + Module 44 disclosure registry.
- Master Volume requirement `CANON-ECON-001` (borrower fee autonomy: borrowers pay nothing — preserved across every shipped runtime).

**How you can verify.** `npm run verify:disclosures` checks every customer-facing surface for the `user-data-sovereignty` disclosure. Exit 0 = every surface declares this in plain English, visible on render.

---

## 2 — Explainability

**What we promise.** We will tell you *why* we asked for each piece of information, *how* it was used, *which recommendations relied on it*, and *how a conclusion was reached* — so you can decide whether to agree.

**Where this comes from.** *Data Transparency & User Sovereignty Doctrine* §"What Furlong Will Do":

> *Furlong will:*
> - *Explain why information is requested.*
> - *Explain how information is used.*
> - *Explain which recommendations relied upon specific information.*
> - *Explain when additional information is needed.*
> - *Explain when information is shared.*
> - *Explain when information is retained.*
> - *Explain when information can be deleted.*
> - *Explain when information can be exported.*
> - *Preserve evidence lineage and recommendation traceability.*
> - *Allow users to understand how conclusions were reached.*

Anchored to Master Volume requirements `IMPLEMENTATION-MANIFEST-001` (runtime manifest traceability) and `CANONICALIZATION-PIPELINE-001` (source canonicalization with conflict preservation).

**How you can verify.** The platform's *Data Transparency Posture Runtime v1* (`src/lib/transparency/dataTransparencyPostureRuntime.ts`) audits every borrower-touching module against those ten "will explain" topics; the Build Self-Report surfaces the result per module.

---

## 3 — Human authority

**What we promise.** Every action that affects you is cleared by a *named, credentialed human*. No AI clears anything. No one clears their own request. Where the action is high-stakes (live activation, final authority, regulatory response), at least two people must approve.

**Where this comes from.** *Module 45 — Human Authority Registry Specification* — `docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md`:

- §1: *"It does not decide anything. It declares who is permitted to and enforces that no one else (and no AI) can. Consistent with 'we facilitate, we do not decide.'"*
- §3 schema invariant: `"ai_permitted": false` · `"no_self_clear": true` · `"separation_of_duties": true` · quorum `min_approvers ≥ 2` on the highest gates.
- §4 hard rule: *"`ai_permitted: false` on every clearing action. The registry validation MUST reject any binding with `ai_permitted: true`."*

The 12 canonical roles are listed in §4 of the Module 45 spec; the 7 that bind Alpha-required actions must be filled before customer-facing access opens. Anchored to Master Volume requirement `ROLE-ARCH-001`.

**How you can verify.** `npm run verify:human-authority` exits 0 only when every clearable action is bound to a named human, no binding permits AI, no binding permits self-clear, and every Alpha-required role is filled.

---

## 4 — Escalation control

**What we promise.** You — not Furlong — decide when your information moves from one stage to the next. We may *recommend* escalation. We will not perform it silently.

**Where this comes from.** *Data Transparency & User Sovereignty Doctrine* §"Escalation Control":

> *Users decide when information moves from:*
> *Exploration → Human Review → Lender Engagement → Application Submission.*
> *Furlong may recommend escalation but will not silently perform escalation.*

Reinforced by *Public Alpha Definition* §1: *"with a human in the loop at every decision point — with no payments, no live external/regulated actions, no official determinations, and no regulated reliance"* — `docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md`. Anchored to `PROMOTION-GATE-001` (production and public-action blocks remain enforced).

**How you can verify.** The Data Transparency Posture Runtime's `transparency_escalation_control_alignment` signal verifies that the four stages are explicit, user-controlled, and represented by at least one governed module. Exit 0 across all four.

---

## 5 — Classification

**What we promise.** Every record carries its sensitivity label (e.g. `RESTRICTED`), its disclosure audience, its sharing permissions, and its export restrictions — and those labels travel with the record wherever it goes inside the platform. We do not lose track of what something is.

**Where this comes from.** Master Volume requirement `CANON-CLASS-001` — *Classification metadata propagation* (implemented). Module 44 Disclosure Audit Gate enforces classification on every audit output (`classificationLevel: "RESTRICTED"`, `publicSurfaceAllowed: false`, `productionBlocked: true`). Module 45 Human Authority Registry inherits the same posture. The platform's `classificationRuntime` (`src/lib/runtime/classificationRuntime.ts`) propagates the label from input through every transformation.

**How you can verify.** `npm run smoke:classification` (and the Build Self-Report's `pii_redaction` cell, which now reads PASS for any PII-touching module that is `productionBlocked + replayRequired + (internal OR governed-DTO public with claimsProfile)` — Build 38 honest posture).

---

## 6 — Privacy

**What we promise.** Minimal disclosure: we use the least information needed for the question in front of us, and we redact before any view goes outside the system. We do not represent your information as verified when it has not been verified.

**Where this comes from.**
- *Data Transparency Doctrine* §"What Furlong Will Not Do": *"Represent user information as verified when it has not been verified."*
- Master Volume requirements `PUBLIC-SURFACE-001` and `SURFACE-GOV-001` — *Public surfaces as governed translation layers* and *Public Surface Gateway and public-safe source DTO governance* (the governed DTO layer strips raw record fields before any render).
- Build Self-Report `pii_redaction` rule (Build 38): a PII-touching module must be `productionBlocked + replayRequired` AND either internal-only OR public through the governed DTO + `claimsProfile`.

**How you can verify.** `npm run smoke:redaction` audits every public surface against an 11-key prohibited-keys list; `npm run smoke:public-surface` confirms surfaces only emit governed DTOs.

---

## 7 — Disclosures

**What we promise.** Every place we show you anything carries — visibly, on render, without you having to click — the disclosures that tell you what you're looking at: that it is advisory, that you cannot rely on it as a legal or regulatory record, that Furlong does not lend or decide, that AI helps with completeness only, that you have data rights, and that borrowers pay nothing.

**Where this comes from.** *Module 44 — Disclosure Audit Gate* §2 (canonical disclosure set):

| disclosure_id | What it asserts | Where it must appear |
|---|---|---|
| `advisory-only` | *"This information is advisory only and is not an approval, guarantee, or official determination."* | all external surfaces |
| `no-reliance` | No legal or regulatory reliance | all external surfaces |
| `no-public-verification` | Not a public verification / official record | all external surfaces |
| `furlong-not-lender` | Furlong does not lend or decide | borrower + lender surfaces |
| `ai-tier1-only` | AI assists with completeness only; no credit/eligibility decisions | borrower + lender surfaces |
| `data-rights` | You may request an accounting, export, deletion, or human review of your information | borrower surfaces |
| `free-for-borrowers` | Borrowers pay nothing | borrower surfaces |
| `user-data-sovereignty` | You remain in control of when your information moves from exploration to engagement | public + borrower + lender surfaces |

`docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md` §2.

**How you can verify.** `npm run verify:disclosures` exits 0 only when every external surface carries every required disclosure for its surface class. The current Build 38 state: **117 of 117 required disclosure checks present across 27 external surfaces.**

---

## 8 — Advisory limitations

**What we promise.** We tell you what we do *not* do, in the same place we tell you what we do. The doctrine lists the prohibitions explicitly so you can hold us to them.

**The prohibitions** (sourced verbatim from *Data Transparency Doctrine* §"What Furlong Will Not Do" + *Disclosure Audit Gate* §3 prohibited-claims corpus + *Public Alpha Definition* §4):

Furlong will not:
- Sell user information.
- Secretly submit user information to lenders, agencies, or brokers.
- Secretly distribute user information to third parties.
- Generate undisclosed marketing leads.
- Hide recommendation logic, pathway exclusions, readiness limitations, known conflicts, or known risks.
- Represent user information as verified when it has not been verified.

And on every external surface, none of these may appear (Module 44 prohibited-claims corpus, with **negation-aware** exemption so doctrine `"Furlong does NOT approve loans"` is recognized as compliant, not as a violation):
- approval / "you qualify" / "pre-approved" / "guaranteed" language;
- decision / "denied" / "rejected" / adverse-action language;
- "the system / AI / algorithm determined eligibility" language;
- "official record" / "you may rely on this" / "legally binding" language;
- "committed funds" / "locked rate" / "sponsor guaranteed" language;
- "publicly verified" / "certified by Furlong" language.

During **Public Alpha**, the following additionally stay off, by design (`docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md` §4): payment capture, live external/regulatory action, official determinations, regulatory reliance, public verification, notice send, live scraper, regulatory examination submission or response.

**How you can verify.** `npm run verify:disclosures` runs the corpus against every external surface; a planted violation (e.g. *"Congratulations, you are approved for $50,000!"*) is caught and blocks the gate (`§7.5 red-team self-test`). The current Build 38 state: **0 unexempted prohibited-claim matches across the 6 corpus categories on all 27 external surfaces.**

---

## 9 — Customer rights

**What we promise.** You have, at any time, five specific rights. You can exercise any of them without giving a reason.

| Right | What it means |
|---|---|
| `REQUEST_EXPLANATION` | "Tell me why I'm seeing this and what it relied on." We owe you the explanation in plain English with the inputs that drove the conclusion. |
| `REQUEST_DELETION` | "Delete what you have about me." We delete it from the live system, preserve only the audit log required for regulatory traceability, and confirm what happened. |
| `REQUEST_EXPORT` | "Give me a copy of what you have about me, in a usable form." We produce a watermarked advisory export — yours to keep. |
| `REQUEST_HUMAN_REVIEW` | "Have a human look at this before it goes anywhere." A named credentialed reviewer takes it. |
| `REQUEST_HOLD_ON_ESCALATION` | "Don't move my information to the next stage yet." Escalation pauses until you release it. |

**Where this comes from.** *Data Transparency & User Sovereignty Doctrine* §"What Furlong Will Do" (the ten "will explain" obligations) + the implementing *Data Transparency Posture Runtime v1* (`src/lib/transparency/dataTransparencyPostureRuntime.ts`) which declares these five rights as first-class user actions on the transparency packet output. Aligned with the *Disclosure Audit Gate* `data-rights` disclosure and the *Human Authority Registry* `Data Rights Officer` role (Module 45 role registry).

**How you can verify.** The data-rights module is `data-rights` (Module 19 alpha-required). Module 45 binds it to the `DATA_RIGHTS_OFFICER` named-officer credential. Module 44 requires the `data-rights` disclosure on every borrower surface.

---

## The two trust principles (in order)

1. *"Trust is not created by collecting information. Trust is created by explaining what is happening and why."*
2. *"Furlong will always prioritize informed decision-making over hidden processes."*

— `docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md` §"Trust Principle"

---

## Traceability — every section above is anchored

| Topic | Anchoring doctrine | Master Volume code(s) |
|---|---|---|
| Data ownership | Data Transparency & User Sovereignty Doctrine §Foundational Principle + Disclosure Audit Gate `user-data-sovereignty` disclosure | `CANON-ECON-001` (borrower fee autonomy), `CANON-CLAIMS-001` (claims governance) |
| Explainability | Data Transparency Doctrine §What Furlong Will Do | `IMPLEMENTATION-MANIFEST-001`, `CANONICALIZATION-PIPELINE-001`, `DATA-FUSION-001`, `REVENUE-INTEL-001`, `OPS-BORROWER-JOURNEY-001` |
| Human authority | Module 45 Human Authority Registry Specification | `ROLE-ARCH-001` (role architecture) |
| Escalation | Data Transparency Doctrine §Escalation Control + Public Alpha Definition §1 | `PROMOTION-GATE-001`, `UX-GOV-001` |
| Classification | Module 44 Disclosure Audit Gate + classificationRuntime | `CANON-CLASS-001`, `SOURCE-PROV-001`, `SOURCE-INGEST-001`, `CONNECTOR-CERT-001` |
| Privacy / minimal disclosure | Data Transparency Doctrine §What Furlong Will Not Do + Public Surface Gateway DTO layer | `PUBLIC-SURFACE-001`, `SURFACE-GOV-001`, `CANON-CLASS-001` |
| Disclosures | Module 44 Disclosure Audit Gate §2 | `CANON-CLAIMS-001`, `PUBLIC-CLAIMS-001`, `UX-GOV-001` |
| Advisory limitations | Data Transparency Doctrine §What Furlong Will Not Do + Module 44 §3 corpus + Public Alpha Definition §4 | `PROMOTION-GATE-001`, `PUBLIC-CLAIMS-001`, `SOURCEINT-001` ("source intelligence is not a decision engine"), `INCIDENT-GOV-001` |
| Customer rights | Data Transparency Doctrine §What Furlong Will Do + Data Transparency Posture Runtime v1 + Module 45 `DATA_RIGHTS_OFFICER` role | `CANON-ECON-001`, `UX-GOV-001` |

---

## Status, posture, and what it does **not** do

This profile is an **internal advisory artifact** that synthesizes existing doctrine into a customer-readable form. It **does not** authorize anything, change platform behavior, create new commitments, or replace the underlying doctrine — it summarizes what is already there.

Constitutional posture preserved (matches every other governed runtime on the platform):
- Production-blocked. No customer-facing publication of this document changes runtime behavior.
- Human review required for any change.
- Advisory only. Not an approval, denial, guarantee, certification, public verification, regulatory reliance, or legal reliance.
- Replay-safe. Same commit, same doctrine source → same profile.
- Audit-safe. Every claim is sourced.
- Conflict-preserving. If a new doctrine ships that contradicts something here, this profile is wrong, not the doctrine — update this document, do not relax the doctrine.

---

## How to confirm this profile against the running platform

Run these five commands from the repo root. The numeric expectations are the current Build 38 baseline.

```
npm run verify:disclosures        # exit 0  · 117 of 117 disclosures present across 27 surfaces
npm run verify:human-authority    # exit 0 only after Ceremony Part C role-fills are recorded in access-control
npm run verify:module-manifests   # exit 0  · 102 modules, sequence contiguous through 45
npm run build:self-report         # exit 0  · 0 cross-source conflicts · 0 module FAILs (post Build 38)
npm run build                     # Next.js production build
```

If any of these does not match, the profile is **out of date with respect to the platform** — not the other way around. Reconcile and re-issue.

---

*Issued: Build 38 checkpoint (commit on `main` at issuance). Sources: `docs/DOCTRINE_DATA_TRANSPARENCY_USER_SOVEREIGNTY_V1.md`, `docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md`, `docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md`, `docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md`, `docs/master-volume-requirements.json`. No new doctrine introduced.*
