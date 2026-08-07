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

## 7. Time-included tiers — NOT credits (founder direction 2026-07-19)

Founder rejected credits as "too transactional." The model is a **flat price per
tier that includes a set bundle of professional consultation TIME**, with tiers
as options (not à la carte purchasing). Time is the included benefit — the unit
a member understands and the unit that anchors to the existing fee schedules
(Stuart advisory **$250/hr**, Caitlin environmental PE **$300/hr**).

**How included time works:**
- Each tier includes a set number of **consultation hours** with the two
  professionals (Stuart / advisory, Caitlin / environmental PE).
- **Hours are fungible.** If a member needs no environmental review, that hour
  **combines into advisory time** instead — e.g. entry tier's *1 hr Stuart + 1 hr
  environmental* becomes *2 hrs with Stuart* when the PE hour isn't needed.
- **The fee schedules still anchor everything.** Overage beyond included hours,
  and standalone orders (a Phase I, a feasibility study), are billed at the
  existing member/published rates — no new pricing invented.
- **Professional pay is preserved (equity rule §2):** when a member uses an
  included hour, the professional is still paid fair-market from the membership
  pool via a CompensationEvent. Furlong keeps subscription margin only.

**DECIDED (founder 2026-07-19): equal-hours conversion for both Caitlin and
Stuart.** 1 PE hr ↔ 1 advisory hr, one-for-one — the member-facing promise is
simply "hours," fully interchangeable between the two professionals. The real
$250/$300 rate difference is reconciled **only in internal compensation**, never
surfaced to the member. (Rejected: equal-dollars / 1.2×-style conversion.)

## 8. Illustrative tier ladder — HOURS ONLY, no prices (prices stay gated)

Shapes only; hour counts + prices are founders + counsel. Never publish prices
until that session (§10, [[membership-tiers-shelved]]).

| Tier | The Compass | Included time (fungible) | Also included |
|---|---|---|---|
| **Entry** | ✓ | 1 hr Stuart + 1 hr PE (or 2 hrs combined) | Priority scheduling |
| **Mid** | ✓ | more hours (e.g. 3 advisory + 2 PE, fungible) | Member rate on a Phase I / feasibility |
| **Top** | ✓ | most hours (e.g. 6 advisory + 4 PE, fungible) | A licensed deliverable offset + direct line |

## 9. Billing cadence — NO monthly (founder direction 2026-07-19)

Charge **annually, every 2 years, 5 years, or lifetime** — never monthly.
- **NO automatic renewals — ever (founder direction 2026-07-19).** Every term is
  one-time; nothing recurring is charged. A membership simply expires unless the
  member chooses to re-subscribe.
- **Wind-down reminder flow (manual re-subscribe):** as a term nears its end,
  email the member **90 days out** and again at **30 days out** so they can
  re-subscribe on their own. No card is charged without a fresh, deliberate
  purchase.
- **Loyalty re-subscribe discount: 35% off** the next term (2-year, 5-year, or
  lifetime) for members who renew via the reminder flow. (The discount RATE is
  set; the base prices it applies to stay gated — §10, [[membership-tiers-shelved]].)
- **Lifetime = one-time**, no renewal at all.
- **Included hours should reset per year, not stockpile.** If a 5-year member's
  hours are annual (use-it-or-lose-it, or capped rollover), Furlong only ever
  holds ~one year of unearned professional time at a time — even on a lifetime
  membership. That deliberately keeps the trust-accounting exposure small (§10).

## 10. Counsel + accountant checklist (BLOCKS live billing)

- **Availability-retainer framing — but Furlong segregates anyway (see §14, controlling doctrine).**
  Counsel drafts the fee as an **earned-upon-receipt availability retainer** (member
  pays to *reserve* Caitlin's / Stuart's capacity, not to pre-buy billable hours),
  and **strict use-it-or-lose-it (§12) is what makes that framing true**. This helps
  revenue recognition and the refund baseline. **However — the outside research's
  next step ("…so it can bypass the trust account and go to operating capital") is
  NOT the Furlong-canonical path.** Per REG-TREASURY-001 + CANON-TREASURY-001 (§14),
  refund-exposed subscription funds are held in a governed **Dispute/restricted
  reserve**, tracked in the Treasury Account Registry — kept separate for refund +
  legal safety (founder-confirmed 2026-07-19), NOT swept to operating cash. Confirm
  per jurisdiction. **Counsel + accountant.**
- **TOS:** define what a tier includes, the fungibility rule (§7), whether unused
  hours roll over or expire, and cancellation/refund treatment.
- **Auto-renewal (ROSCA + state laws): N/A — resolved by design.** No term
  auto-renews; renewal is a fresh manual purchase after the 90/30-day reminders
  (§9). This removes the entire auto-renewal-law surface. (Still keep the reminder
  emails truthful + the re-subscribe path easy — good practice, not a mandate.)
- **Limited-scope retainer / fractional engagement:** the membership is
  limited-scope — a defined block of hours, not 24/7 full-service; prevents scope
  creep + liability.
- **RESPA / PE-ethics on bundling** (already flagged): counsel + PE board bless
  bundling licensed work into a membership that also routes loans.

## 11. Tech stack — no custom billing engine needed

- **Stripe** (already wired, test mode): flat tier subscriptions + multi-year
  one-time or recurring terms. **Simpler than credits** — no per-unit deduction
  engine; a tier is a subscription + an entitlement of included hours.
- **Included-hours tracking** (grant on purchase / decrement on a booked consult /
  annual reset / audited) rides the treasury spine (`REG-TREASURY-001`) — build
  post-launch, replay-certify, then wire Stripe live. Until then: design only.

## 12. Annual Capacity Reservation Model (2026-07-19 refinement)

Present the whole thing to counsel as an **"Annual Capacity Reservation Model with
Velocity Caps"** — an organized professional-services firm, not an unregulated
prepaid bank. Mechanics adopted:

- **Annual allotment:** each tier = a set number of hours **per year**, discounted
  vs. the standard $250/$300 rate to reward the subscription.
- **Retail-price anchor:** the contract states the $-value of the included hours
  (e.g. "includes 50 hours valued at $250/hr"). This is the legal baseline for any
  refund/breach math — and it's an internal contract term, not a member "credit."
- **Reset = strict use-it-or-lose-it (Option A, adopted).** On the membership
  anniversary, unused hours drop to zero and a fresh block issues. This is what
  turns the fee into an earned **capacity-reservation / availability retainer**
  (§10). *Fallback if founders want goodwill:* Option B — cap rollover at 10–20%,
  usable only in the first 60 days of the new year (max liability ≈ 1.2 yr).
- **Top-up blocks:** if a member burns their annual pool early, they buy more time
  at a **subscriber rate (~10% off retail)**; top-ups **expire at that year's end**
  — no free overflow, no perpetual banking.
- **Velocity caps:** hours have a per-month ceiling (e.g. 100/yr but ≤15 in any
  single month without prior written approval) — stops one client from dumping a
  huge project and burning out the team. **Adopt this.**
- **Multi-year / lifetime = consecutive ANNUAL capacity blocks, not a lump sum.**
  Lifetime clause (counsel to finalize): *"Lifetime membership grants a
  non-transferable right to access up to X hours of service per calendar year.
  Unused annual allocations do not accumulate, have no cash redemption value, and
  expire fully at the end of each contract year."* Keeps lifetime liability at
  ~one year, always.

**Reconciliation note — auto-renewal disclosure does NOT apply to us.** The source
research assumes auto-renewal (15–30-day ARL renewal notices). Furlong does **not**
auto-renew (§9): nothing recurring is charged, renewal is a fresh manual purchase.
Our 90/30-day emails are courtesy nudges + the 35% loyalty offer, not ARL-mandated
disclosures. Do not let the capacity model reintroduce auto-billing.

## 13. Advisory vs. Transactional scope split — the liability moat (2026-07-19)

The included hours cover **advisory time only**. **Transactional execution is
always excluded** and billed separately (member gets a preferred rate). Contracts
must state this line explicitly — it's what protects the licenses and the labor.

| Discipline | Advisory — INCLUDED in Guild hours | Transactional — EXCLUDED (billed separately) |
|---|---|---|
| **Environmental (Caitlin, PE)** | compliance Q&A, EPA/state reg-update reviews, high-level desktop audits | Phase I/II ESAs, fieldwork, sampling, lab fees → member **discount** (e.g. 15%) on orders via the existing env order flow |
| **Mortgage (Stuart)** | annual mortgage review, HELOC/equity optimization, credit-health check | actual origination / underwriting / loan processing |

**MORTGAGE RECONCILIATION (critical — do not skip).** The source research says the
mortgage transactional bucket = "standard origination fees." That collides with the
constitutional rule *"Furlong is free for borrowers — no fees, ever"* ([[membership-tiers-shelved]] layer 1;
[[licensed-module-fee-and-kyc-model]]). Correct mapping for Furlong:
- Advisory hours (reviews, optimization, credit-health) → Guild subscription. ✅
- Transactional loan execution → **lender-paid compensation** (founder-clarified
  2026-07-19): the borrower's origination cost is billed by the **lender**, the
  lender pays Stuart, and **neither Stuart nor Furlong bills the borrower directly**.
  So the transactional bucket never touches a Furlong invoice *or* a Stuart-to-
  borrower invoice — it's the lender's charge. This is the cleanest possible fit
  with the loans-free rule: the platform touches none of it.
- This seam (anything that looks like charging around a loan) is a **RESPA** item →
  **Stuart's pre-launch compliance review (#34)** confirms the lender-paid-comp
  mechanics per his licensing.

Environmental has no such collision — transactional env work is legitimately a
paid order today; the Guild just adds an advisory layer + member discount on top.

**Launch sequencing (recommendation, founders' call):** if one paid advisory
retainer goes first, **environmental leads** — it has the cleaner compliance seam
(no loans-free/RESPA adjacency), Caitlin controls it directly as the PE, and the
order flow + real fee schedule already exist. The mortgage advisory retainer should
follow Stuart's RESPA/Reg-Z review (#34). Either way, NEITHER goes live (paid) until
the founders + counsel session + treasury spine — Labor Day ships the informational
Guild page + test-mode intake only.

## 14. Controlling Master Volume doctrine — subscription money is HELD SEPARATE

The Master Volumes already govern where subscription money goes, and they are MORE
conservative than the outside research. This section is authority, not proposal.

**REG-TREASURY-001** (Vol II, Batch 27 — *Treasury, Capital Allocation & Reserve
Governance*). Core Rule: no capital may be "received, allocated, transferred,
distributed, reserved, or spent outside governed treasury controls." Binding
required controls that apply to Guild subscription revenue:
1. **Treasury Account Registry** of all bank/payment/**reserve/restricted/escrow**
   accounts + custody locations — restricted/escrow funds are first-class + tracked
   separately.
4. **Revenue waterfall** (taxes → costs → **restricted obligations** → reserves →
   compensation → reinvestment → distributions).
5. **Operating + a *separate* emergency reserve** with defined targets.
6. **Separation of powers** — no single actor controls approval, execution,
   reconciliation, and attestation.

**CANON-TREASURY-001** (Vol V §3 — Reserve Architecture): six governed reserve
types, including **Dispute Reserve — "funds held pending resolution of contested
treasury events"** (the refund/dispute holdback). Each reserve has a floor;
breaching it needs a `TreasuryApproval`. Subscription income enters as a classified
`RevenueEvent` and flows the waterfall — it is **not** swept into operating cash.

**Consequences for the Guild build:**
- Subscription money is **held separate** for refund + legal safety (Dispute /
  restricted reserve + Treasury Account Registry) — supersedes §10's operating-
  capital shortcut. Founder-confirmed 2026-07-19.
- The availability-retainer framing (§10/§12) still applies for recognition, but
  does **not** exempt Furlong from segregating refund-exposed funds.
- **This IS the treasury spine.** REG-TREASURY-001 is DESIGNED-not-built; the reserve
  types, registry, waterfall, and separation-of-powers must exist before any live
  subscription charge. Confirms the sequence: modules launch test-mode; live Guild
  billing waits on the treasury-spine build + counsel (post-launch).
- Vol II also **"prohibits kickbacks, unearned fees, and referral fees in any
  settlement service arrangement"** (RESPA §8) — independent confirmation of the
  mortgage reconciliation (§13): transactional loan work can't be a Furlong fee.

## 15. Inflation & cost-escalation protection — 5-year / lifetime tiers (2026-07-19)

A fixed lifetime price with fixed hours forever LOSES money as fuel, Stuart's
compliance costs, and base billable worth rise. 5-yr/lifetime tiers MUST carry an
escalation mechanism. Adopted (corrected to fit prior decisions + doctrine):

**A. Hours step-down — NOT a dollar burn-rate.** The annual capacity block shrinks
on a published schedule, expressed in HOURS (illustrative):
- Years 1–5: 15 hrs/yr → Years 6–10: 12 hrs/yr → Years 11+: 10 hrs/yr.
- **Rejected: the "$X time-credit that buys fewer hours" (CPI burn-rate) variant** —
  it reintroduces the CREDIT model the founder rejected 2026-07-19 (§7). Keep it in
  hours. (If founders ever want true CPI indexing, index the hour schedule via a
  stated formula, still expressed to the member as hours.)
- Fits §12's "consecutive annual capacity blocks" — each block's size just steps
  down on schedule; encoded in the versioned TreasuryPolicy (CANON-VER-001).

**B. Pass-through surcharges for HARD costs — disclosed at intake, billed per-incident
(NOT a silent card-on-file auto-charge).** Included hours cover intellectual labor
only; hard/fluctuating costs pass through separately:
- Site visits / field travel → mileage + fuel surcharge (e.g. IRS standard rate +
  offset); third-party software pulls, credit reports, external regulatory/state
  filing fees → billed **at cost**.
- **CORRECTION vs. source research:** the research bills these "automatically to the
  card on file." That reintroduces the auto-billing the founder eliminated (§9) AND
  violates Vol II §9.1 ("fee disclosure at intake; no post-hoc fee assessment").
  Instead: **disclose the full pass-through schedule at intake**, and bill each as a
  **discrete, itemized, member-authorized charge** tied to a specific service event
  (member knows a site visit carries the surcharge before it happens). Each = its
  own governed `RevenueEvent`.
- Bonus: keeping hard costs OUT of the hours strengthens the availability-retainer
  framing (§10) — the retainer stays pure intellectual labor = cleaner earned-upon-
  receipt argument.

**C. Regulatory Force Majeure → "Specialized Execution" (extends §13).** If a new
local/state/federal compliance framework fundamentally raises the baseline labor for
a standard advisory workflow, the affected workflow reclassifies OUT of the annual
allotment into transactional "Specialized Execution," billable at the professional's
current specialized rate, subject to the standard member discount. Applies to both
env (new EPA/state rule) and mortgage (new lending reg). Put in the 5-yr/lifetime
terms.

**Prices stay gated.** The source research's "$35,000 lifetime" is illustrative
STRUCTURE only — actual upfront price, hour counts, step-down schedule, surcharge
rates, and discount % are founders + counsel ([[membership-tiers-shelved]]).

## 16. M&A / exit readiness — lifetime tier (2026-07-19)

Unstructured lifetime members tank valuation (buyers see open-ended, unfunded
liability). Build the exit rules in on day one; they can't be retrofitted.

**The model already defuses most of the risk — SEE THIS FIRST.** The research treats
lifetime as a liability bomb, but our architecture caps and funds it:
- Use-it-or-lose-it annual hours (§12) → unfunded liability is ~ONE YEAR at a time,
  never "a lifetime of hours."
- Refund-segregated Dispute/Continuity reserves (§14) → that one year is already
  funded + held separate.
- Earned-upon-receipt availability retainer (§10) → each year's fee is recognized.
- Result: diligence finds a **capped, funded, tagged** liability, not an open
  obligation. The research's own golden rule ("tag them so a buyer sees capped hours
  protect the bottom line") is how we're already built = an advantage at sale.

**Natural capacity cap.** Lifetime capacity is bounded by two professionals' finite
hours + the velocity caps (§12) — you physically can't oversell it. Formalize the
research's "keep lifetime < 5–10% of users" as a policy cap; it's partly self-
enforcing. Tag lifetime members in the entitlement/treasury records so the pool +
its capped hours are legible to a future buyer.

**TOS clauses for counsel — FOUNDER-AGREED 2026-07-19 (structure locked; counsel drafts wording):**
- **"Lifetime" = operational lifespan of the product/entity, NOT the human buyer** —
  and DISCLOSED plainly at purchase (honest only if disclosed up front).
- **Assignment / successor clause** — agreement assignable at Furlong's discretion;
  an acquiring entity may transition/modify/buy out the terms. (Ties to Vol II
  Batch-27 institutional-succession doctrine.)
- **Substantial-change-of-service clause** — lifetime access attaches to the current
  product iteration/scope.

**TRUST-BRAND FAIR-TREATMENT FLOOR — FOUNDER-AGREED 2026-07-19.** The research's
"successor may terminate at discretion" is bait-and-switch and collides with the
constitutional consumer-protection ethos — REJECTED. The structural clauses above are
adopted ONLY when paired with the fair-treatment floor: on dissolution or fundamental
restructure, Furlong (or the successor) guarantees a **fair, RESERVE-FUNDED buyout or
refund** (funded from the Continuity + Dispute reserves, CANON-TREASURY-001 §3). Both
M&A-ready AND consistent with "we don't exploit you." **Never a bare terminate-at-will.**

**Buyer transition scenarios (buyer's call at sale, noted for founders):**
grandfather-into-legacy-tier / paid sunset-with-grace-period+discount / buyout-
allocation-at-cost. Our job now is only to make all three CLEAN via tag + cap + fund.

**BUILD OBLIGATIONS registered on the treasury spine (REG-TREASURY-001, post-launch,
gated).** When the treasury spine is built, it MUST include — so the fair-treatment
floor is real, not aspirational:
1. **Tag** — every membership entitlement record carries: tier, term type (annual /
   2yr / 5yr / lifetime), person-vs-entity holder, and a lifetime flag → the pool +
   capped hours are legible for diligence and for the <5–10% policy cap.
2. **Cap** — annual-hours allotment + velocity caps enforced per TreasuryPolicy;
   step-down schedule (§15) applied by contract year.
3. **Fund** — Continuity + Dispute reserves carry a governed floor sized to cover the
   outstanding fair-buyout/refund obligation for active lifetime members; breaching
   the floor requires TreasuryApproval (CANON-TREASURY-001 §3).
These are counsel-drafted TOS + treasury-spine build items — no live code today
(shelved economics + Backend-First gate); wording + price/refund figures stay
founders + counsel.

## 17. Top luxury / institutional tier — the Veblen anchor (2026-07-19)

A deliberately high top tier ("Legacy Founder" / corporate advisory shield) aimed at
UHNW / institutional buyers. Two functions: (1) **price anchor** — it frames the 2-yr
and 5-yr tiers as reasonable; (2) **real capital injection** from the rare buyer.

**Adopt:**
- **Anchor role** — legitimate BECAUSE the tier is genuinely deliverable, not a decoy
  we won't honor (deliverability is a constitutional-honesty requirement).
- **Corporate transferable asset** — tie the top tier to the buyer's ENTITY;
  transfers with the business on sale. This is the §16 assignment clause aimed at the
  realistic buyer: the institutional dev/real-estate firm writing it off as CapEx.
- **Genuine capacity scarcity (NOT "artificial").** The 5–10 slot cap is real — two
  professionals' finite hours + velocity caps physically bound it (§16 natural cap).
  Honest scarcity > manufactured scarcity, and it reads as more prestigious.
- **Managed concierge channel** — a dedicated priority line, but ROUTED THROUGH A
  MANAGED CHANNEL, never a principal's personal cell/WhatsApp (founder safety posture:
  no personal exposure — anti-swatting, minor children). Same proximity feel, safe.

**Three corrections vs. the source research (it fights prior decisions):**
- **"Non-refundable capital" → NO.** Top-tier money is still held separate + governed
  (Dispute/Continuity reserve, §14) with the fair reserve-funded buyout/refund floor
  (§16). A real capital injection, but governed + reserved — never "keep it all."
- **"Zero additional cost forever" → partial.** A luxury tier MAY lock the
  professional's HOURLY RATE on the CAPPED hours as its premium perk — but ONLY if
  priced to fund ~20 yrs of rate inflation on those bounded hours, AND **hard pass-
  throughs still pass through at cost (§15B) at any price.** Honest promise: "your
  advisory RATE is locked for life; third-party hard costs billed at cost" — NOT
  "zero cost." Do not promise absorption of costs you don't control (fuel, filings).
- **Concierge line → managed channel, not personal cell** (safety, above).

**Prices + slot count stay gated.** The research's "$50k–$100k / 5–10 slots" and the
"price it until it's uncomfortable" philosophy are founders + counsel calls
([[membership-tiers-shelved]]). If nobody buys it, it still earns its keep by driving
clients into the 2-yr / 5-yr packages (anchor value).

## 18. Capacity-governed enrollment — ALL tiers (founder-agreed 2026-07-19)

Founder principle: capacity is finite across EVERY tier, not just lifetime — bounded
by licensed-professional hours. AI helps, but only so far (below). Scarcity is real
and uniform. Enrollment is limited-now-with-governed-growth. Better than arbitrary
slot numbers:

- **Capacity-DERIVED slots, not marketing numbers.** Available slots per tier =
  *(professional hours committable to the Guild) − (hours already promised to active
  members, expected-utilization-weighted) − (safety reserve)*, converted to openings.
  The number is always TRUE, self-enforcing (can't sell a desk the hours can't back),
  and it **rises automatically when capacity is added** — "open more slots" becomes a
  governed capacity event, not a marketing guess.
- **Waitlist, not a closed door.** When full, interest joins a waitlist → prestige
  (a waitlist IS exclusivity) + warm pipeline + a demand signal that tells you when
  to add capacity. Admit the next cohort when a seat frees (expiry) or capacity grows.
- **Reserve buffer — never sell to 100%.** Hold a slice of hours unsold for overage,
  velocity spikes (§12), and delivery quality. Same discipline as the treasury reserve
  floors (§14), applied to TIME.
- **AI raises the ceiling; licensed-human hours stay the hard cap.** AI extends
  throughput on ROUTINE advisory (triage, drafting, research, common Q&A) so each
  professional hour goes further — but it does NOT extend the licensed/judgment/
  relationship hours (PE sign-off, lender advisory, "real person on your file"). The
  capacity ledger counts HUMAN LICENSED HOURS as the binding constraint, with AI as a
  throughput multiplier. Keeps scarcity honest even as efficiency rises.
- **Consumer-protection alignment:** this enforces the existing rule *"never sell
  hours that can't be delivered"* structurally, not aspirationally.

**Build obligation (adds to task #35 / treasury spine, gated):** a **capacity ledger**
(professional-hours supply vs. committed demand, expected-utilization-weighted, with a
reserve buffer) governs enrollment for every tier; **waitlist state**; slot-opening as
a governed capacity event under TreasuryPolicy. No live code pre-launch; utilization
assumptions + the buffer size + per-tier slot math stay founders + counsel.
