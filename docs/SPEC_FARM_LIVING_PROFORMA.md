# Spec — Farm "Living Pro-Forma" (interactive best-use + coverage)

**Origin:** Founder testing feedback, 2026-08-12. The `/discover` Farm tab showed a
generic "Diversify — no single use dominates" card with a hardcoded "~$0–$150 net/ac"
string and ranked money-losing commodity row crops as a top option on a 60-acre parcel.
Founder direction: replace the cards with a **living pro-forma** — a summary verdict, a
numbers table, and toggles to swap enterprises and watch the economics recompute — "like
a living Excel spreadsheet but looks like a Word document onscreen; easy on the eyes but
mathematical and precise."

## What already exists (build ON this, do not rebuild)
- **`src/lib/property/agriculturalOpportunityOptimizer.ts`** — pure function; per-enterprise
  gross, opex, **NOI**, startup, **DSCR**, risk-adjusted NOI, diversified 50/30/20 portfolio.
  Pure → **runs client-side on every toggle.**
- **`src/lib/property/dscrCoverageSolver.ts`** → `solveDscrCoverage` — the money answer,
  already built: verdicts **`clears` / `close` / `cannot`**, soil/topography exclusions with
  reasons (wet→no alfalfa, ≥15% slope→no row crops, capability class ≥6→not cropland),
  `bestSingle`, `bestMix`, `gapAnnual`, `outsideIncomeNeeded`, `maxSupportablePrice`,
  `planRequirements` (equipment capital, irrigation, market channels).
- **`src/components/public/FarmBestUseFinanceWorkspace.tsx`** — a `"use client"` scaffold with
  live acres/price/rate inputs. Expand this (or a sibling) into the pro-forma.
- Already surfaced in the **pro-forma PDF** (`app/api/public/property-proforma-pdf/route.ts`)
  and workspace (`PropertyEvaluationWorkspace.tsx:3366`) — reuse the same inputs.

## The disconnect to fix
The **Farm tab** (`components/property/lanes/FarmAgricultureTab.tsx`) renders the OLD
heuristic `farmBestUse` (hardcoded strings, generic diversify). The REAL engine
(`solveDscrCoverage`) is only in the PDF/finance panel. **Bring the real engine to the tab.**

## Build (in founder's order 1→4)
1. **Drive from the real engine.** Farm tab consumes `solveDscrCoverage` output, not the
   heuristic strings. Retire/replace `farmBestUse`'s hardcoded `grossPerAcre` constants.
2. **Never surface a full-cost-loss enterprise as best.** Rank by real soil-adjusted NOI;
   negative/near-zero net drops to the bottom or is flagged "walk away from this use."
3. **Coverage verdict, PROMINENT, with the WHY.** Lead with `clears / close / cannot`. For
   **`cannot`**: bold, plain-language advisory — *"Based on the numbers, agriculture alone
   won't carry this purchase: shortfall ~$X/yr; it pencils only under ~$[maxSupportablePrice]
   or with ~$[outsideIncomeNeeded]/yr of off-farm income."* Keep existing advisory framing
   ("screening only," "estimated," "confirm before committing"). Founder-approved to say, in
   appropriate language, that a property is **not a good buy on the numbers** — prominence is
   required, not optional.
4. **Parcel-specific naming** — name the enterprises (`bestSingle`/`bestMix`) and the soil
   reasons (already in the engine).

## The living pro-forma (the new UI)
- **Top: summary verdict** — the coverage sentence (#3), color-weighted (clears=green,
  close=amber, cannot=red-but-calm), with the two numbers that matter (net/yr, DSCR).
- **Middle: the table** — rows = the modeled enterprises; columns = **Enterprise · Acres/share ·
  Gross/ac · Expenses/ac · Net (NOI)/ac · Total Net/yr · DSCR contribution**. Precise numbers,
  right-aligned, monospace figures; Word-document typography, generous line-height, no card noise.
- **Toggles** — per category (crop, livestock, hay, tree/orchard, vegetable, flower, energy),
  the visitor can pick a *different* option than best-case. Two lines/columns shown together:
  **Best case** and **Your scenario** — expenses and net recompute live and the delta is visible.
- **Inputs** — reuse acres / price (or BPO) / rate / amort / LTV from the existing scaffold; a
  "use estimated BPO" toggle when no list price.
- **Expense transparency** — expand a row to see the opex + startup + irrigation composition.
- All recompute is the pure optimizer client-side; instant, deterministic, no network.

## Guardrails
- Deterministic math only — **no AI generates any number or the verdict** (consistent with the
  permanent AI doctrine). The engine is the source of truth.
- Advisory/screening framing throughout; never an appraisal, agronomic prescription, or credit
  decision. Borrower's documented history outranks the model (already stated in the engine notes).
- Dual render: the same numbers must reconcile with the pro-forma **PDF** path.

## Acceptance
- 60-ac prime-cropland parcel: commodity row crops is NOT "best fit" when it loses on full cost;
  the verdict states plainly whether the parcel carries its debt.
- Toggling livestock→sheep (or crop→X) visibly changes net and expenses in the table.
- A parcel that cannot carry the debt shows the prominent "not a good buy on the numbers"
  verdict with the shortfall, max supportable price, and off-farm income to close it.
- `npx tsc --noEmit` green; verify in the browser preview; ships via the governed staging redeploy.

## Next accuracy build (founder direction 2026-08-13) — do these RIGHT, not rushed
Emphasis: accuracy for a lender-facing tool. Rough placeholder numbers would undercut the
whole point, so these ship with defensible data, clearly labeled, tunable.

1. **True combination optimization** — optimize the acre allocation across ALL feasible streams
   to maximize net (today's "best mix" is the engine's top-3 heuristic at fixed 50/30/20 shares,
   not a real optimizer). On small acreage a tuned pair (e.g. alfalfa + clover small squares)
   often beats a broader spread — the model must find that, and say when a single stream truly wins.
2. **Climate / region feasibility** — gate crops by hardiness zone / region; you can't grow
   alfalfa in FL/AL (except a specific variety that likely isn't worth it). `hardinessZone` is
   already on FarmPropertyFacts, unused today. Say the honest "specific variety, not worth it."
3. **State water / runoff / sustainability rules** — per-state water-use, runoff, and
   environmental constraints that change what's viable and its true cost; fold into feasibility + cost.
4. **Market-access pricing + channel depth** (this is where the money is real):
   - **Settable prices** per enterprise (the engine already takes bale price as a parameter —
     expose it). A grower who can move small squares at $25–40/bale pencils completely
     differently from one who can't.
   - **"Do you have the channel?"** input — the same crop is a different business with vs.
     without the market. Reflect it in the numbers, not just a note.
   - **Market saturation** — does the market exist, and is it 2 players, 200, or 2,000? Depth and
     competition move the achievable price and volume; show it.
   - **Novel / untapped markets** for the parcel as a genuine advantage to surface — BUT only
     ones with a real, legal path to actual revenue and profit. No wish-and-a-prayer picks:
     "pot is legal in most states" ≠ "you can plant it and convert it to profit easily." Every
     surfaced market must be genuinely convertible to currency, or it doesn't get shown.
5. **Per-species sub-toggles** — swap sheep/cattle/goats, apple/peach, specific vegetables/flowers —
   built on the real per-species economics from #1–#4, not placeholders.

## Property valuation — Furlong's own, comps-free (founder direction 2026-08-13)
**Decision: build this feature COMPLETE, then one clean deploy — no half-shipped version.**
A tool that can't stand behind a property's value loses the customer for every other number.
We derive value ourselves, from **published government data + this parcel's own economics** — never
individual comparable sales (noisy/biased), never deferring to the realtor. Engine:
`src/lib/property/farmlandValuation.ts` (built; the FARM profile of a shared engine).

- **Three headline values** a customer wants: **Land alone · Improvements alone · Combined.**
  - Land = acres × USDA state farm real-estate $/ac, soil-capability adjusted (reliable).
  - Improvements = cost approach: depreciated replacement (value) AND undepreciated rebuild cost.
  - Combined = land + improvements.
- **Income / productive value** cross-check = best-use NOI ÷ cap rate (cap rate = USDA cash rent ÷
  USDA land value). "With discount" (earnings-only) vs "without" (market land) falls out naturally.
- **Square footage is NEVER trusted on entry** — record or customer. Plausibility-guarded (abs bounds
  + can't exceed half the parcel); only a MEASURED/calculated footprint is "verified"; unverified sqft
  is flagged and excluded from the reliable value. A wrong number must never skew the result.
- Every rate is a named, tunable constant; every figure USDA-cited. Screening, not an appraisal;
  a licensed appraisal and a real arm's-length price both outrank it.
- **Seeds the pro-forma price** (Combined value) so the coverage verdict computes even with no asking
  price; a real asking/offer price always wins. Replaces the "±20%, trust the market" hedge.

### Hazard-adjusted rebuild estimator (part of this feature)
The rebuild figure becomes parcel-specific so a customer can catch a contractor over/under-bidding:
- **Rebuild RANGE** ($/ft² low–high × area), not a single number.
- **Flood** (FEMA zone A/V/coastal) → elevated foundation: **piers/pilings, breakaway walls, flood
  vents**; premium added; explicit "must be built on piers" callout for beach/river/lake incl. Great Lakes.
- **Seismic** (USGS seismic design category by location) → bracing, foundation reinforcement, anchorage.
- **Wind / hurricane** (ASCE 7 wind-speed; strictest FL/GA/NC/Gulf — Florida Building Code, Miami-Dade
  HVHZ) → hurricane straps, impact-rated glazing, roof-attachment upgrades.
- Each applicable hazard NAMES its required construction and adds its cost premium; output states
  "code here requires [X], so a real rebuild runs $A–$B — a bid far under that is missing the hazard work."
- Grounded in FEMA + USGS + ASCE public data. Where a hazard's data source isn't wired yet, say so
  rather than guess (same integrity rule as the closed-comps BPO).

### Generalize to all three lanes (same engine, different weighting — later phase, not this ship)
- Farm/land: land value leads, income cross-checks. **(this feature)**
- Commercial: **income (NOI ÷ cap) leads**, cost cross-checks — type-specific cap rates.
- Residential: **cost (land + improvements) + assessment-reconciliation lead**, income only for rentals.
