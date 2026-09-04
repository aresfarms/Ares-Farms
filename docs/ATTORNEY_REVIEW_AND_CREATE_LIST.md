# Attorney Review & Creation List — Pre-Live-Launch

**Prepared:** 2026-07-19 · **Launch target:** Labor Day (Sept 7, 2026)
**Basis:** Master Volume Series (Vol I–VII) + the repo's own `verify:master-volumes`
conformance gate + the doctrine-to-code gap ledger.

## Context an attorney needs first (one paragraph)
Furlong is a **facilitate-not-decide** platform: it surfaces possibilities,
analysis, and licensed professional services, but it does **not** itself lend,
qualify, approve, price, or make credit/environmental determinations. At launch it
is **IAP-private, test-mode** (no live payments, no live lending decisions, no
external sends). Two **licensed** modules exist — environmental (Caitlin, PE) and
financing (independent licensed financing professional / lender counsel review). The platform's backend governance is
substantially complete (`verify:master-volumes` PASSES: 57/60 requirements
implemented; the 3 remaining are **intentionally blocked** pending controlled
promotion + qualified human/legal approval — that approval is largely what this
list is for).

---

## A. The 3 "controlled-promotion" gates — counsel sign-off unblocks them
These are BUILT but intentionally blocked. Each needs counsel review before it may
go live (the code will not promote without recorded approval).

1. **Production & public-action block** — live external calls, payments, notices,
   official reports, verification authority. Counsel confirms the disclosures,
   liability posture, and approval chain before any of these activate.
2. **Public-surface reliance block** — public production exposure + reliance
   (claims, redaction, access, rate-limit, public-copy, verification boundaries).
   Counsel approves the public claims + disclaimer language.
3. **Live-source reliance block** — live listing/source freshness, source
   certainty, production source reliance. Needs **source legal + licensing**
   approval (listing-feed agreements) before live data is relied upon.

---

## B. Documents the attorney must CREATE (launch-blocking unless noted)

| # | Document | Why / basis | Launch-blocking? |
|---|---|---|---|
| B1 | **Terms of Service** (platform) | governs all use; facilitate-not-decide boundary | YES |
| B2 | **Privacy Policy + data-handling disclosures** | RESTRICTED PII on service requests; classification model | YES |
| B3 | **Limited-scope PROFESSIONAL ENGAGEMENT agreements** — environmental (PE) and advisory (lender) | licensed work is contracted, not platform-provided; scope + liability | YES (before any paid engagement) |
| B4 | **Consent / e-sign disclosures** for intake (contact + property) | CANON-CONSENT-001; recorded at intake | YES |
| B5 | **Guild membership agreement** — draft to the strawman in `GUILD_TIER_PROPOSAL_DRAFT.md` §7–18: availability-retainer (earned-on-receipt), use-it-or-lose-it annual hours, velocity caps, pass-through disclosure, advisory-vs-transactional scope, lifetime=entity-lifespan, assignment/successor, fair reserve-funded buyout floor | membership economics (founders + counsel) | NO — post-launch (gated) |
| B6 | **IOLTA / trust-accounting determination** for prepaid professional time | whether unearned prepaid hours must sit in trust | NO — with B5 |
| B7 | **Lender-paid-compensation / RESPA memo** for the licensed-financing-provider seam | borrower compensation and lender-paid compensation must follow the approved provider agreement and applicable law | YES (with #34) |
| B8 | **Source / listing data LICENSING agreements** | live-source reliance gate (A3); partner feeds not scraped | before live data (A3) |
| B9 | **Vendor DPAs + subprocessor list** (hosting, email/SendGrid, Stripe, AI) | data-processing governance; examiner-ready | YES (SendGrid/Stripe already in use) |
| B10 | **Breach-notification procedure** (legal steps + timelines) | incident governance built; the legal workflow is counsel's | YES |
| B11 | **Fair-lending / ECOA / adverse-action framework** — for WHEN live lending activates | applies only when live credit decisions happen (currently BLOCKED) | NO — before live lending |
| B12 | **Entity / succession instrument** (MissionProtection) | institutional succession; who inherits obligations | NO — pre-scale |

---

## C. Surfaces the attorney must REVIEW (existing, launch-blocking)

- **Financing copy** — Reg Z / trigger-terms, no rate/APR promises, "facilitate not
  decide," no pre-approval/qualification language (financing intake + lane copy).
  *(Overlaps task #34 — independent financing compliance review.)*
- **Environmental copy** — PE scope/liability, no environmental determination
  implied, order-not-clearance framing.
- **Public claims + disclaimers** — the advisory-only posture, HUBZone/place-fact
  honesty, no guarantee language (feeds gate A2).
- **Fair-housing** — the brief-copy gate enforces this in code; counsel confirms the
  policy is legally sufficient.
- **Section 1071 firewall** — confirm the no-demographic-data architecture satisfies
  counsel (columns don't exist by design).
- **Pricing/anchor tiers** — consumer-protection review of the Guild tier ladder +
  the luxury anchor (no deceptive decoy; genuine deliverability).
- **Auto-renewal (ROSCA)** — confirm N/A given the no-auto-renewal decision
  (manual re-subscribe only); one-line confirmation.

---

## D. NOT legal — operational/evidence items for launch readiness (owner/ops, not attorney)
Surfaced by the conformance gates; listed so they aren't mistaken for legal work:
- **Accessibility** — `smoke:accessibility` FAIL: 11 pages have axe violations. Fixable in code (buildable now).
- **Secret rotation** — task #33 (SendGrid key + shared secret + dummy sender exposed in setup).
- External pentest / SBOM evidence, backup/restore drills + RPO/RTO, SLO/alerting/on-call — post-launch hardening.

---

## What is NOT a gap (audit result)
The Master Volume backend is built-out: `verify:master-volumes` PASSES (57/60
implemented; 3 intentionally gated per §A). The treasury spine (REG-TREASURY-001),
the last PDF-flagged "DESIGNED" item, was built 2026-07-19. There are **no unnamed
doctrine gaps** — the repo's doctrine-gap ledger names every blocked item.
