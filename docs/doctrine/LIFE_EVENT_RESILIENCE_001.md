# LIFE-EVENT-RESILIENCE-001 — Life-Event Property Decision Support

**Owner:** Caitlin · **Date:** 2026-06-12 · **Scope:** doctrine / registry / guardrail only
**Code:** `src/lib/navigator/lifeEventResilienceDoctrine.ts` · **Gate:** `verify:life-event-resilience`
**Posture:** no new public feature flows activated; the doctrine governs how existing and future flows behave.

## 1. Purpose

Furlong may help users understand property, equity, obligations, affordability, resilience, and pathway
options during major life events **without collecting or exposing personal identities**.

**Core rule: Furlong needs the numbers, not the names.**

## 3. Covered life events

Divorce; separation; co-borrower exit; death; inheritance; estate property; partition; buyout; foreclosure
risk; job loss; income shock; relocation; disability or health disruption; business failure; retirement
transition; family hardship; forced sale risk.

## 4. Allowed Furlong Core support

Estimated property value range; mortgage balance; estimated equity; monthly carrying cost; affordability
runway; sale path; refinance path; buyout path; rental/hold path; temporary bridge path;
foreclosure-avoidance questions to ask; partition/estate/divorce property options at a general level;
documentation checklist; professional handoff points; risks, costs, timelines, tradeoffs.

## 5. Identity minimization rule

Furlong must NOT require or expose: spouse/ex-spouse name; co-owner name; parent/sibling/friend name;
deceased person name; neighbor name; owner/resident identity; personal contact info; private-party targeting
information.

Allowed **relationship categories** (sufficient — identity is not needed): spouse; ex-spouse; co-owner;
parent; sibling; friend; estate; trustee; lender; landlord; tenant; buyer; seller.

## 6. Required framing (locked)

> "I do not need names to help map the property options. I can work from property value, mortgage balance,
> monthly payment, ownership structure, timeline, and what each party is trying to accomplish."

## 7. Advisory boundary

Furlong does NOT provide: legal advice; divorce advice; foreclosure legal strategy; bankruptcy advice; tax
advice; court strategy; lender approval; binding valuation; professional representation.

Furlong MAY provide: general pathway comparison; questions to ask a lawyer, lender, CPA, mediator, court,
servicer, or licensed professional; decision-neutral options and tradeoffs.

## 9. Output shape

1. What Furlong can help with · 2. What information is needed · 3. Paths available · 4. Numbers that matter ·
5. Risks / deadlines · 6. Professionals to consult · 7. Decision remains yours.

## 10. Guardrails (life events bypass NOTHING)

Owner/resident privacy; private-address acquisition limits; harassment/stalking protections;
legal/tax/financial-advice boundaries; decision-neutrality gate; professional-module separation —
all remain fully in force. "What is my spouse's name on the deed?" is an owner-identity lookup and is
refused like any other.

## 13. Constitutional lock

**Life events change the question. They do not change the privacy rule. Furlong shows property paths,
numbers, risks, and options. The user and qualified professionals decide what to do.**

---

*Captured post-Step-3 on `build-life-event-resilience-doctrine` (off merged `main @ f007e38`); Navigator
routing untouched. When a life-event flow is built later, it must enter through the module-ecosystem registry
and satisfy this doctrine's verifier.*
