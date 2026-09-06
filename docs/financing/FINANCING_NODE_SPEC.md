# Furlong financing node (property-anchored) — SPEC (deferred build)

**Date:** 2026-06-12 · **Owner:** Caitlin · **Status:** SPEC CAPTURED, build deferred.
**Gate:** `FINANCING_NODE_LIVE = false` · disclaimer is a **counsel DRAFT — do not publish as-is.**

This is the **Programs** node of the Navigator arc (Person → Story → Assets → Constraints → Pathways →
Evidence → **Programs** → Tradeoffs → Decision → Journey). It is **informational, not advice.**

## The one idea: invert the input

MMCG's loan-comparison calculator starts from a number the user types (Total Project Cost). Furlong owns the
upstream thinking, so it **derives** the number from the property:

```
MMCG:    [user types project cost]            → loan comparison
FURLONG: [property] + [intended use] → DERIVED project-cost RANGE → loan comparison
```

Same financing engine at the back; Furlong feeds it from the property. A typed override may be an *optional*
power-user input, never required.

## Deriving the project-cost RANGE (every figure a range + basis + as-of date)

1. **Acquisition cost** — property price (pasted listing / comps / recorded sale) → range.
2. **+ Buildout / renovation / conversion** — driven by intended use (STR conversion, ag operation, fit-out,
   adaptive reuse) → range with basis.
3. **+ Soft costs** — permits/fees (ordinance layer) + contingencies.
4. **= Total project cost RANGE** → run the program comparison at low / mid / high.

## Program selection by asset/use class (ag foregrounded for Furlong's base)

- **Land / agricultural** → foreground **USDA B&I, USDA FSA farm loans, Farm Credit, REAP/rural** alongside SBA.
- **CRE / business** → **SBA 504, 7(a), Express** centered.
- Selected from the Universal Intent Classifier's `assetClass` (see `universalIntentClassifier`).

## Output mapping (MMCG report section → Furlong node component)

| MMCG section | Furlong component | Change |
|---|---|---|
| 1. Project Parameters (typed cost) | Derived parameters | cost RANGE from property+use; no required borrower number |
| 2. Loan Comparison Summary | Program comparison table | same columns as ranges; programs filtered by asset type |
| 3–6. Per-program detail | Per-program detail cards | + USDA/FSA ag programs for farmland |
| Equity / capital stack viz | Capital stack viz | driven from the derived range |
| Balloon / rate-risk | Risk flags | honest material-rate-risk notes |
| 7. Market Rates & Methodology | Evidence/methodology panel | same public sources, basis + as-of date |
| 8. Disclaimer & Data Sources | Disclaimer | Furlong-tailored counsel DRAFT |

## Data sources (all PUBLIC — synthesis is the value, not the numbers)

- **FRED** rate series (DPRIME, DGS10, SOFR30DAYAVG) — live, with as-of date.
- **FOIA / open SBA loan-level data** to calibrate rate spreads by profile.
- **Federal program rules** by citation (SBA SOP 50 10 8; SBA fee notices; USDA 7 CFR Part 5001; Federal
  Register B&I rule; USDA FSA farm-loan authorities). Public law — gather directly, same rule as the
  ordinance layer. NO live fetcher until the LIVE_FETCH activation gate passes.

## Compliance seam (how this exists without a license)

- **Furlong core:** the informational, property-anchored comparison. No advice, no "you qualify."
- **Licensed handoff:** personalized feasibility / structuring / underwriting → an authorized external finance
  module (Five Borough) or a licensed provider in the directory (a firm like MMCG is exactly that paid
  provider). Furlong routes a ready user out; it does not give the advice itself.
- Locked rule, always visible: **"a program fitting this project is not the same as you qualifying."**

## Definition of Done (when built)

- Project cost derived from property + use as a RANGE, never a required typed number (typed override optional).
- Program set selected by asset/use class; ag/USDA/FSA foregrounded for land, SBA for CRE/business.
- Every figure carries basis + as-of date; comparison run at low/mid/high.
- Informational framing + disclaimer present; **counsel sign-off before publish** (ties to LEGAL-REVIEW +
  licensed-module preconditions).
- Personalized/advice/qualification requests route to the licensed module / provider, not answered in core.

## Sequencing

Deferred. Build **after** the discovery engine merges and the property + ordinance layers are live — this node
consumes their outputs. Until then this spec + the gated contract (`financingNodeContract.ts`,
`FINANCING_NODE_LIVE = false`) capture the shape without shipping behavior.
