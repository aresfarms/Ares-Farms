# Stuart's Pre-Launch Compliance Review — Financing Surfaces

**For:** Stuart (licensed lender / NMLS) · **Prepared:** 2026-07-19
**Launch:** Labor Day (Sept 7, 2026) · **Posture:** IAP-private, **test-mode**
(no live payments, no live credit decisions) at launch.

## How to use this
Furlong **facilitates, does not decide** — it never lends, qualifies, approves,
prices, or makes a credit determination. Your job here is to confirm every
financing-facing surface stays inside that boundary and inside lending law. Each
item lists the **exact file** to check and what "pass" looks like. Check the box or
note a change needed. Anything you flag becomes a copy edit before launch.

---

## 1. Reg Z / Truth-in-Lending — trigger terms
Displaying a rate or a payment figure can trigger mandatory TILA disclosures.
Confirm the rate displays are **informational market data**, not an offer.

- [ ] **`src/components/public/CapitalRatesBlock.tsx`** + **`src/lib/property/capitalRatesLive.ts`** — live FRED prime/Treasury/SOFR shown as *market indices*, clearly sourced/dated, with **no** "your rate," APR, term, or payment amount. ✅ target: index values only.
- [ ] **`src/components/public/LoanProgramComparison.tsx`** — SBA 7(a)/504/USDA B&I side-by-side: confirm ranges are **program-typical education**, not quotes; no APR, no "you qualify," no payment schedule.
- [ ] **`src/components/public/HundredPercentFinancingCallout.tsx`** — "0% down / 100% financing is possible" must read as *possibility*, program-dependent, not a promise or an offer of credit.
- [ ] Confirm **no trigger term** (specific rate + term + payment + down payment together) appears anywhere that would require a full TILA disclosure box.

## 2. RESPA §8 + lender-paid compensation (the seam we defined)
- [ ] Confirm the model: on a real loan, the **lender** bills the borrower and pays you; **neither Furlong nor you bills the borrower directly** for facilitation. (See `docs/GUILD_TIER_PROPOSAL_DRAFT.md` §13.)
- [ ] Confirm **no kickback / unearned fee / referral fee** structure anywhere (Vol II RESPA §8). Furlong takes **no** transaction-tied compensation — verify the copy says so: **`src/lib/financing/intakeRuntime.ts`** disclosures ("Furlong takes no compensation tied to your transaction").
- [ ] Confirm the Guild advisory subscription is **not** payment for loan facilitation (advisory time only; §13 advisory-vs-transactional split).

## 3. ECOA / fair lending / adverse action
- [ ] **`src/lib/financing/intakeRuntime.ts`** — confirm the intake makes **no** credit decision: flags `advisoryOnly:true`, `qualificationDetermined:false`, no adverse-action language, no scoring. ✅ target: records + routes only.
- [ ] **Section 1071 firewall** — confirm no demographic data is collected on the intake (the fields do not exist by design). Verify `src/db/schema/serviceRequests.ts` has no demographic columns.
- [ ] Confirm "a program fitting your project is not the same as you qualifying" appears (intakeRuntime disclosures).

## 4. Licensing / NMLS
- [ ] Confirm your **NMLS** identifier + the consumer-access link display where you're presented as the lender (**`src/lib/financing/financingFeeSchedule.ts`** "How you're protected" block links `nmlsconsumeraccess.org`).
- [ ] Confirm nothing presents Furlong itself as a licensed lender/broker — it routes to **your** licensed channel.

## 5. Program representations (SBA / USDA / FSA)
- [ ] **`src/lib/financing/loanProgramComparison.ts`** + **`src/lib/property/financingProgramsCurated.ts`** — confirm program facts (eligibility, use, typical structure) are accurate and current; no guarantee of approval or specific terms.
- [ ] **`src/lib/financing/pathwayEngine.ts`** — confirm "pathway" language = *possible fit*, never eligibility/qualification determination.
- [ ] **Farm financing facts** — confirm FSA Direct up-to-100% / Down Payment Program (5%+45%+50%) / cross-collateralization framing is accurate (`src/lib/property/farmLaneCurated.ts`, farm branch of the cost model). This came from Caitlin's own purchase — verify it generalizes correctly.

## 6. Fee schedule
- [ ] **`src/lib/financing/financingFeeSchedule.ts`** — confirm: consumer loans **free**; advisory **$250/hr**; engagement retainer **"Free — every tier."** No per-deal comp, no contingency fee. Ranges read as *typical*, not quotes.

## 7. Micro-funding fee caps (if applicable)
- [ ] If any platform coordination fee is ever assessed on sub-$50k SBA-Microloan / USDA-B&I standalone deals, it must use the **micro-tier schedule, disclosed at intake, no post-hoc assessment** (Vol II REG-TREASURY-001 §9.1). At launch no fee is charged, so confirm this is documented for when it activates.

---

## Sign-off
- [ ] I have reviewed each surface above and the financing copy stays inside
      facilitate-not-decide and inside Reg Z / RESPA / ECOA.
- [ ] Items needing a copy change (list): _______________
- [ ] Legal items I'm routing to counsel (feeds `ATTORNEY_REVIEW_AND_CREATE_LIST.md`
      §B7 RESPA memo, §B11 fair-lending framework, §C financing review): _______________

**Stuart:** ____________________  **Date:** __________
