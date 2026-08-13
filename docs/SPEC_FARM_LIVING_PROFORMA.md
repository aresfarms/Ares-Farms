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
