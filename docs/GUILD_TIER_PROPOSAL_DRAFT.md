# Furlong Guild — Tier & Equity Proposal (DRAFT for founders + counsel)

**Status:** DRAFT / planning input. NOT live. All prices below are **illustrative
placeholders** — the real numbers, inclusions, and revenue splits are set by
**both founders (Caitlin + Stuart) + counsel** at the economics session, per the
shelved-monetization rule. Bundling licensed work also needs **counsel + PE-board
sign-off** (RESPA-inducement + PE ethics). This doc is the strawman to react to.

---

## 1. The equity problem, stated plainly

The Guild bundles work that costs real money to perform:

| Service | À la carte anchor (sourced) | Who performs it |
|---|---|---|
| Phase I ESA | $1,900 – $4,500 | Caitlin (PE) |
| Phase II / subsurface | $5,000 – $35,000 | PE + coordinated lab |
| EIA | $10,000 – $60,000 | PE |
| Permit support | $5,000 – $25,000 | PE |
| General env / chem eng | $300/hr | PE |
| Financial advisory (hourly) | $250/hr | Stuart (licensed) |
| Engagement retainer | $500 – $2,500 | Stuart |
| Flat advisory | $500 – $2,000 | Stuart |
| **USDA feasibility study** | **$4,900 (VAPG/REAP) → $6,900–$14,500 (B&I/CF)** | PE + Stuart (or contracted specialist) |
| The loan itself | **Free to the consumer** | Stuart (lender-paid) |

If a cheap tier "includes" an expensive stamped deliverable, either the
professional is underpaid (inequitable to them) or the platform loses money.
Equity means: **the tier price funds fair-market pay for whoever does the work.**

## 2. Five equity principles (the guardrails)

1. **Professionals are always paid fair market for work performed.** When a member
   redeems an included/credited service, the subscription funds a compensation
   payment to the PE or the broker at their rate. No one gives away stamped or
   licensed work below cost.
2. **Inclusions are bounded** — "one included per term" or "$X in credits," never
   unlimited — so tier economics are predictable and the price can be set to
   cover them plus platform margin.
3. **Furlong earns subscription margin only** — never a per-deal / transaction-tied
   fee. The platform collects the membership, pays the professionals for redeemed
   work, and keeps the coordination/analysis margin.
4. **Compliance separations hold inside every tier:** the loan stays free; the PE's
   fee and opinion are independent of any loan outcome and never contingent; the
   advisory is a standalone service you can buy and then borrow anywhere.
5. **Customer wins too:** the bundle is cheaper than à la carte, predictable, and
   the analysis + coordination layer is free — that's the reason to subscribe.

## 3. Strawman tier ladder (ILLUSTRATIVE — founders set real prices)

| Tier | ~Price (placeholder) | What's included | Economics |
|---|---|---|---|
| **Explorer** | Free | All analysis, briefs, live rates, education, the Dispatch teaser. À la carte at standard rates. | Top of funnel; ~zero marginal cost. |
| **Member** | entry | The Dispatch, **member à la carte rates** (discount on reports + advisory), priority coordination, a small service credit. | Margin funds the discount; light. |
| **Pro** | mid | **Engagement retainer free** (per Caitlin's direction), a **credit block** toward environmental / feasibility work, deeper member rates, one included smaller deliverable (records-level review or a consult block). | Priced to cover the credit block + margin. |
| **Institutional / Developer** | high (annual or per-project) | Includes **one Phase I** (or a **feasibility-study credit**), most reports a typical project needs, advisory included, priority PE + lender time. | Priced to cover the included stamped work + margin. |

## 4. How each founder is made whole

- **Caitlin (PE):** paid her rate / report fee for every environmental deliverable a
  member redeems, funded from the tier; à la carte at full rate. The subscription
  never asks her to perform stamped work below market.
- **Stuart (licensed lender/broker):** unchanged lender-paid compensation on closed
  loans (loan stays free to the consumer) **plus** advisory fees funded from the
  tier when a member redeems advisory/retainer time, at his rate.
- **Feasibility studies:** performed by the right professional (or a contracted
  specialist); the $4,900+ fee funds that work; included only at the top tier,
  priced to cover it. Split between PE (technical) and Stuart (financial) per the
  founders' agreement.

## 5. Open decisions for the Stuart + counsel session

- Actual tier prices + exact inclusions/credits per tier.
- The internal compensation rates / revenue split (how subscription revenue maps
  to PE and broker compensation payments).
- **Counsel + PE-board sign-off** on bundling licensed work (RESPA-inducement, PE
  ethics, state licensing).
- Who performs USDA feasibility studies and how the fee is split.
- Treasury-ledger implementation of the compensation flow (this is the
  previously-gated treasury spine — subscription RevenueEvent → CompensationEvent
  to the professional, auditable).

## 6. Portal build implications (later, gated)

- Tier definitions live in a **governed registry** (like the licensed-module
  registry) — config, not code.
- **Live pricing + checkout stays gated** behind the treasury spine + counsel
  sign-off. The membership-tiers-shelved rule holds until this session happens.
- Until then, the portal shows the *services* and *"Guild credits apply"* framing
  (already built) — but no live tier prices or checkout.

---

## 7. Credit mechanics (DRAFT — founders + counsel set the numbers)

Model: each membership loads a **credit balance**; services have a **price in
credits**; add-ons/top-ups when a member runs low. Illustrative only.

**Service → credits price list (illustrative; PE/broker set real values):**

| Service | ~Credits (placeholder) |
|---|---|
| The Compass (newsletter) | included, no credits |
| 30-min advisory / consult | small |
| Loan-fit & paperwork session | medium |
| Phase I ESA | large |
| Feasibility study (VAPG/REAP) | largest |

**Rules to decide with counsel:**
- **Credit value** — the $-per-credit conversion (must be stated in the TOS).
- **Rollover** — "use it or lose it" per term vs. limited rollover. Given
  multi-year terms hold *unearned licensed fees*, rollover interacts with trust
  accounting (see §9) — decide together.
- **Add-ons / top-ups** — one-off services or extra credit blocks at a member
  rate; these are à la carte at the member discount.
- **Professional pay** — every redeemed credit for licensed work funds a
  fair-market CompensationEvent to the PE/broker (the equity rule, §2).

## 8. Billing cadence — NO monthly (founder direction 2026-07-19)

Charge **annually, every 2 years, 5 years, or lifetime** — never monthly.
- **Lifetime = one-time** → no auto-renewal → simplest legally (ROSCA/auto-
  renewal laws largely don't apply to a non-recurring charge).
- **Multi-year (2/5-yr)** → prefer **one-time, non-auto-renewing** terms; if any
  auto-renews, ROSCA + state auto-renewal law apply (explicit consent, clear
  terms, easy cancel).
- Trade-off to weigh: longer prepaid term = more unearned licensed fees held
  upfront = more trust-accounting weight (§9).

## 9. Counsel + accountant checklist (from Caitlin's research — BLOCKS live billing)

- **IOLTA / trust accounting (the sharp one):** multi-year/lifetime upfront =
  holding *years of unearned professional fees* (credits fund licensed PE +
  broker work). Determine whether prepaid credits must sit in trust and be
  revenue-recognized only on redemption, with refund-on-cancel obligations.
  Protects the PE license + the broker license. **Counsel + accountant.**
- **TOS:** define a credit, the $-conversion, how credits deduct, and what
  happens to unused credits on cancellation.
- **Auto-renewal (ROSCA + state laws):** only if any term auto-renews — consent,
  clear/conspicuous terms, one-click cancel. Lifetime/one-time avoids it.
- **Limited-scope retainer / fractional engagement:** the membership is
  limited-scope — not 24/7 full-service; prevents scope creep + liability.
- **RESPA / PE-ethics on bundling** (already flagged): counsel + PE board bless
  bundling licensed work into a membership that also routes loans.

## 10. Tech stack — no custom billing engine needed

- **Stripe** (already wired in this stack, currently test mode): sells credit
  packs + tiers + multi-year one-time or recurring terms, and can drive the
  charge. Chargebee/Maxio are unnecessary given Stripe is already integrated.
- **The credit LEDGER** (issue / deduct / balance / rollover / refund, audited)
  IS the treasury spine (`REG-TREASURY-001`) — build post-launch, replay-certify,
  then wire Stripe live. Until then: design only.
