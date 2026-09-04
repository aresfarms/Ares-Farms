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

## Implementation anchors

- `src/lib/property/commercialAlternativeUses.ts`
- `src/lib/property/commercialConversionIntelligence.ts`
- `src/lib/property/commercialUseModel.ts`
- `src/components/property/lanes/FinanceAnalysisPanel.tsx`
- `src/app/api/public/property-proforma-pdf/route.ts`
- `src/scripts/propertyIntelligenceExpansionConformance.ts`
- gate: `npm run verify:property-intelligence-expansion`
