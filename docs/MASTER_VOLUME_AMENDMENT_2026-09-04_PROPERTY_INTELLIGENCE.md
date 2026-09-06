# Master Volume Amendment — Property Intelligence + Regulatory Conversion Runway

**Date:** 2026-09-04
**Status:** ACTIVE DESIGN / IMPLEMENTED SCREENING LAYER
**Applies to:** commercial, hospitality, mixed-use, agricultural-business and other business-purpose property intelligence surfaces.

## Canonical product rule

Furlong is not a generic listing-data product. Its property-intelligence layer combines **property facts + best-use screening + zoning/conversion execution risk + environmental posture + DSCR + USDA + FSA + SBA + conventional financing pathways** in one governed analysis.

The breadth is an advantage only when the interface reduces decision burden. The customer should see a short recommended/primary path first, then progressively reveal alternatives, evidence and specialist detail. The platform therefore uses **progressive disclosure** rather than presenting every possible program, use and permit path at the same visual weight.

## Customer-visible property intelligence hierarchy

Every business-purpose property report should strive to show, in this order:

1. Property identity and classification.
2. Current use, as supported by the parcel/listing/source record.
3. Best-supported use from the modeled evidence available now.
4. Secondary opportunity where a materially different use is plausible.
5. For any conversion opportunity: zoning/conversion runway, likely review class, timeline range, professional soft-cost range, local-fee-schedule requirement, major studies/approvals, resubmission risk and the authority that must confirm the path.
6. Environmental indication and any triggered professional review.
7. DSCR / cash-flow coverage and the assumptions behind it.
8. Financing-path comparison across the program families actually relevant to the property.
9. Execution risks and next evidence needed to turn a screen into a decision-ready package.

## Furlong Property Estimate — type-aware valuation rule

Furlong must **not** use one universal estimate formula across residential, farm, commercial, hospitality and land. The valuation method must follow the asset class and the evidence actually available.

- **Residential:** an assessment-derived screen may be produced only when the jurisdiction's assessment-to-market basis **and the source-verified assessment effective date** are known. The assessment is then walked forward using the exact quarter-to-quarter FHFA single-family House Price Index for that state. If the parcel source does not publish the assessment vintage, Furlong publishes **no numeric estimate** from that assessment. A fetch date must never masquerade as a valuation date.
- **Commercial / hospitality / mobile-home park:** Furlong must never apply the residential FHFA HPI. A numeric screen requires property/project NOI plus a current market-supported capitalization-rate range, or a future governed closed-sale-comparable method. Direct capitalization is `NOI ÷ cap rate`; the cap rate must be market evidence, not an invented generic national assumption. Hotels and operating businesses may also require going-concern/business-value allocation and additional appraisal methods.
- **Farm / agricultural:** when verified acreage is available, Furlong may use the current USDA NASS state average farm-real-estate value per acre (land + buildings) as a deliberately broad state-level screen. It must carry a wide band and clearly state that soils, productive acres, water, improvements, easements, conservation restrictions, development pressure, access and local closed sales can move an individual farm far outside the state average.
- **Bare non-agricultural land:** Furlong publishes no numeric estimate from residential HPI or a generic acreage multiplier. It requires recent closed land comparables or another parcel-specific market basis.

A seller's asking price is market **evidence**, not proof of market value. An arm's-length contract or closed sale is stronger transaction-level evidence, but a material divergence from a screening model must still be reconciled rather than blindly forcing the model to equal the transaction price. A licensed appraisal outranks every Furlong screening indication.

The customer-facing label is **Furlong Property Estimate — screening**. If the required valuation evidence is missing, the correct output is **Needs property-specific valuation evidence** with the missing inputs named. Refusing to publish an unsupported number is a successful control, not a missing feature.

## Senior-housing conversion rule

Hospitality and similar buildings may surface **Senior housing / independent-living conversion** as a secondary opportunity when the shell is plausibly adaptable. It must always be labeled **subject to zoning/conversion review**.

The platform must not invent senior-housing NOI or DSCR from a generic square-foot rent model. A credible finance model requires unit/room count, service level, staffing and operating assumptions where applicable, and conversion/code capital requirements.

The report may provide a screening timeline and professional-cost allowance, but it must state that local hearing calendars, completeness rules, public process, agency referrals, redesign, denial and resubmission can materially extend the result. Municipal fees must be pulled from the current jurisdictional fee schedule before being treated as property-specific.

## Zoning / permitting workflow

Furlong's conversion workflow is:

**use-table confirmation → pre-application meeting → required-study matrix → concept/site-plan + code review → filing sequence → hearing/agency referrals → comments/conditions → resubmission tracker → permit/license closeout.**

This is intended to help a customer understand the real calendar and professional workload before committing capital. It does not replace a municipal determination, zoning opinion, architect/engineer scope, legal advice, licensing decision or permit approval.

## Psychology / decision-support basis

The product intentionally avoids "show everything at once." Research on choice overload finds that large assortments are most likely to impede decisions when choice-set complexity, task difficulty and preference uncertainty are high. Commercial property acquisition has all three characteristics. Attribute-based decision-support research also shows that structured aids can reduce cognitive effort and preserve perceived control as complexity rises.

Accordingly Furlong should organize complexity instead of deleting it: a concise primary finding, one secondary opportunity, then expandable comparison detail. This preserves the strategic advantage of spanning USDA + FSA + SBA + conventional pathways without making the customer perform the integration mentally.

## Competitive positioning

PropertyShark and Crexi demonstrate that customers already pay for property/market intelligence. Furlong should not try to win by cloning their broad listing databases. Its differentiated report should answer the transaction questions those products generally leave to the customer or advisor: **Can this use work? What else could this property become? What approvals stand between here and there? How long and expensive could that path be? What environmental review is likely? Does the income support the debt? Which public/private financing families fit the property? What must be proven next?**

## Source / evidence notes

Research basis reviewed 2026-09-04:
- Chernev, Böckenholt & Goodman, *Choice overload: A conceptual review and meta-analysis*, Journal of Consumer Psychology 25(2), 333-358 (99 observations; N=7,202).
- Kamis, Koufaris & Stern, *Using an Attribute-Based Decision Support System for User-Customized Products Online*, MIS Quarterly 32(1) (2008).
- NAIOP Research Foundation, *The Development Approvals Index* (2021) and follow-on approvals analysis (2023): approval-process transparency, accountability and consistency affect duration, cost and completion risk.
- PropertyShark subscription feature/pricing page, reviewed 2026-09-04.
- Crexi Intelligence feature/pricing page, reviewed 2026-09-04.
- FHFA House Price Index: state single-family house-price movement; Furlong snapshot refreshed 2026-09-04 through 2026Q2.
- Maryland MD iMAP / SDAT field metadata: `SDATDATE` is the Assessments data-linkage/download date, while `LASTASSD` is the parcel field labeled **Last Date Assessed**. Furlong uses `LASTASSD` as the assessment-vintage input and never substitutes `SDATDATE`.
- USDA NASS, Ag Land Asset Value: state farm real-estate value per acre (land + buildings), 2025 series used as agricultural screening context.
- Appraisal Institute income-capitalization guidance: direct capitalization converts a single year's stabilized NOI into value using a market-derived capitalization rate; Furlong does not invent the rate.

## Implementation anchors

- `src/lib/property/commercialAlternativeUses.ts`
- `src/lib/property/commercialConversionIntelligence.ts`
- `src/lib/property/commercialUseModel.ts`
- `src/lib/property/marketValueIndication.ts`
- `src/lib/property/stateHpiGenerated.ts`
- `src/lib/property/stateFarmlandGenerated.ts`
- `src/components/property/lanes/FinanceAnalysisPanel.tsx`
- `src/app/api/public/property-proforma-pdf/route.ts`
- `src/scripts/propertyIntelligenceExpansionConformance.ts`
- gate: `npm run verify:property-intelligence-expansion`
- gate: `npm run verify:property-value-indication`
