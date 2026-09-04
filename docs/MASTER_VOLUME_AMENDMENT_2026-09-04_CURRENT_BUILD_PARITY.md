# MASTER VOLUME AMENDMENT — CURRENT BUILD PARITY

**Effective:** 2026-09-04  
**Status:** CONTROLLING CURRENT-BUILD AMENDMENT  
**Amendment ID:** MASTER-BUILD-PARITY-2026-09-04  
**Machine mirror:** `docs/current-build-parity.json`

## 1. Controlling rule

The Master Volume Series and the executable Furlong platform must describe the same current system. A capability may not be represented as implemented in the Series unless the corresponding runtime/evidence exists, and the build may not silently implement a material doctrine that is absent from the current Series.

For the scoped subjects below, this amendment supersedes conflicting legacy wording in earlier Volume exports while preserving those earlier files as historical/versioned evidence. The base-volume authority hierarchy remains intact for every subject not expressly amended here.

## 2. Furlong Core financing boundary

Furlong Core is property/project intelligence, program-navigation, readiness, orchestration, consent and evidence infrastructure. It does not make a lender's credit decision, approve or decline credit, issue a lending commitment, or make a person-side program determination on behalf of SBA, USDA, FSA, a CDC, Farm Credit institution, bank, broker or other provider.

For nonresidential property, Furlong's own property feasibility, program/pathway ranking and Capital Network provider matching must not score or rank personal credit score, personal income, household debt-to-income, household assets, personal liquidity, personal net worth or similar personal-financial profile data. Property/project economics remain valid inputs because they describe the asset and transaction: price, use, occupancy, revenue, expenses, NOI, DSCR, conversion budget, collateral/property facts, zoning, environmental posture, market support and execution timing.

A selected provider may separately obtain and use borrower/business financial information under its own program, underwriting, licensing and compliance obligations. Furlong may collect or transmit such information only as governed evidence for an authorized recipient and purpose; it does not flow backward into Furlong's nonresidential property score, pathway rank or provider rank.

Optional user tools may calculate a customer's own business/farm ratios locally for the customer's information. The existing Farm Financial Health self-check is client-side only: its entries are not sent to Furlong, not persisted by Furlong, and do not influence nonresidential property scoring, pathway ranking or provider matching. A calculator is not a Furlong underwriting input.

Residential mortgage workflows are the explicit exception to the personal-financial input boundary. Residential readiness may require borrower credit/income/debt/asset information, but Furlong still does not make the lender's final credit decision.

## 3. Program registry interpretation

The current Program Registry separates `property_side_criteria` from `person_side_criteria`. Every person-side criterion is `verifiable_by_furlong: false`. The standing language is: **the property/program may fit; that is not the same as the customer being approved or qualified by a provider.**

Accordingly, legacy Volume II/IV wording that described Furlong Core as directly verifying borrower net worth, net income, personal creditworthiness, household DTI or similar person-side underwriting for nonresidential SBA/USDA/FSA pathways is superseded by this amendment. The current Furlong Core runtime screens property/program fit and missing evidence; provider-side underwriting owns the person/business decision.

This scoped amendment applies to the current interpretation of `REG-USDA-001/002/003`, `REG-FSA-001/002`, `REG-SBA-001/002/003` and their corresponding operational runbooks. It does not remove any provider's obligation to apply the actual program rules that govern that provider's decision.

## 4. Scoring doctrine interpretation

Legacy `REG-SCORE-001` and `OPS-SCORE-001/002` language describing a general Furlong financing-likelihood score driven by credit score, DTI and personal financial history is superseded for nonresidential Furlong Core.

Current Furlong readiness scoring is operational completeness/readiness guidance: intake completeness, property/program evidence, documents, environmental posture, discovery and review state. Current property/project scoring may evaluate property readiness and transaction economics. Neither may become a personal-credit score or autonomous financing approval proxy.

The active `/api/rank` route is now a property/project ranking runtime using named property readiness, program-fit, evidence, execution, environmental and property-risk inputs. The active `/api/test-score` route is now a property/project diagnostic using the same non-personal boundary. Both explicitly reject personal-financial scoring fields rather than silently accepting or ignoring them. The portfolio demo uses the same property/project fields.

Older applicant-credit scoring modules may remain only as quarantined migration/history artifacts. They are not current platform authority and may not be imported into active API routes. The parity gate checks that prohibition.

Generic model-governance, explainability, replay, bias-control and feature-governance doctrines remain applicable to any scoring/model runtime that exists. Any future residential borrower-scoring implementation must be segregated to the residential product domain, explicitly registered, tested and reconciled before activation.

## 5. Capital Network hard rules

The current multi-provider Capital Network is governed by these non-negotiable rules:

- Furlong does not sell borrower leads.
- Furlong does not auction borrower files.
- Furlong does not shotgun a borrower file to a lender list.
- Provider compensation has zero influence on ranking.
- Furlong affiliation has zero influence on ranking.
- The borrower chooses the recipient provider(s).
- Provider selection alone shares no file.
- Exact provider/package/purpose/channel consent and recipient authority are required before governed disclosure/delivery.
- A future Furlong-affiliated lender is one provider among others and receives no algorithmic priority.

These rules are the current executable interpretation of `CONST-FAIR-001`, `ECON-CONFLICT-001`, `ECON-CONFLICT-REG-001`, `FACILITATION-001`, `CANON-FACILITATE-001` and the lender/provider operational doctrines.

## 6. Provider execution reliability

Furlong may maintain an evidence-backed record of how providers execute Furlong cases. The record may use verified milestones and outcomes such as first response, provider disposition and closed/funded status. It may not use borrower personal-financial profile, provider compensation, affiliation or quoted interest rate as a provider-ranking input.

Customer-facing performance metrics require at least **5 verified Furlong outcomes**. Execution history may affect ordering only as a tie-break between otherwise-equal property/program/provider suitability scores and only when **both providers have at least 10 verified provider-decision outcomes**. Borrower withdrawals and property/program/third-party/external blocks are separately counted and excluded from the provider close-rate denominator.

## 7. Property intelligence and valuation

The current property-intelligence amendments remain controlling. Residential, farm/agricultural, commercial/hospitality and bare-land valuation methods are asset-type specific. Residential FHFA HPI must never be applied to commercial, hospitality, farm or bare-land assets. Unsupported numeric valuation is prohibited; the platform must instead state the missing property-specific evidence.

The deterministic operating model is property/project-side math. AI may interpret and challenge assumptions but may not replace the deterministic calculation, make a credit decision or introduce personal-financial scoring into the nonresidential model.

## 8. Current governance and provider identity

Furlong is owner-controlled under the current governance transition. The retained external broker workspace remains a transition/provider instance only and confers no ownership, treasury, governance, architecture or default-routing authority. Current provider identity and case access are provider-scoped and consent-scoped.

## 9. Current schema and proof surface

The canonical schema target for this build is **0057**. Migration `0056_capital_network_multi_provider.sql` establishes the multi-provider network and provider-bound deal rooms. Migration `0057_capital_network_execution_reliability.sql` establishes evidence-backed provider execution records.

Standing implementation/proof anchors include:

- `src/lib/capital-graph/programRegistry.ts`
- `src/lib/financing/pathwayEngine.ts`
- `src/lib/readiness/readinessAssessment.ts`
- `src/lib/financing/capitalNetworkRuntime.ts`
- `src/lib/financing/capitalNetworkExecutionReliability.ts`
- `src/lib/property/propertyOperatingModel.ts`
- `src/lib/property/marketValueIndication.ts`
- `src/lib/db/canonicalGovernanceMigrations.ts`
- `src/lib/db/migrations/0056_capital_network_multi_provider.sql`
- `src/lib/db/migrations/0057_capital_network_execution_reliability.sql`
- `docs/MASTER_VOLUME_AMENDMENT_2026-09-04_PROPERTY_INTELLIGENCE.md`
- `docs/MASTER_VOLUME_AMENDMENT_2026-09-04_AI_OPERATING_MODEL.md`
- `docs/CAPITAL_NETWORK_MULTI_PROVIDER_2026-09-04.md`
- `docs/governance/OWNER_CONTROLLED_PLATFORM_TRANSITION_2026-09-03.md`

Standing gates:

- `npm run verify:master-volume-build-parity`
- `npm run verify:master-volumes`
- `npm run verify:capital-network`
- `npm run verify:capital-network-execution`
- `npm run verify:program-registry`
- `npm run smoke:readiness-assessment`
- `npm run verify:property-operating-model`
- `npm run verify:property-value-indication`
- `npm run build`

## 10. Final parity rule

If this amendment, the machine mirror, the requirement/reconciliation matrices and executable runtime disagree, **the discrepancy is a build defect**. `verify:master-volumes` must fail until the Series and build are reconciled. Historical PDFs remain immutable evidence of prior doctrine versions; they do not silently override a later scoped amendment registered as current.
