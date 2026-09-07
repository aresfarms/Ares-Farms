# MASTER VOLUME AMENDMENT — CURRENT BUILD PARITY

**Effective:** 2026-09-04; scoped extension effective 2026-09-05  
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

The current multi-provider Capital Network is governed by these non-negotiable rules. The 2026-09-05 Platform Experience, Customer Economics & Living Case amendment adds the customer-free financing core, institution-funded economics, living-case continuity, provider published-box evidence, outcome learning, and security-claim gate:

- Furlong does not sell borrower leads.
- Furlong does not auction borrower files.
- Furlong does not shotgun a borrower file to a lender list.
- Provider compensation has zero influence on ranking.
- Furlong affiliation has zero influence on ranking.
- The borrower chooses the recipient provider(s).
- Provider selection alone shares no file.
- Exact provider/package/purpose/channel consent and recipient authority are required before governed disclosure/delivery.
- A future Furlong-affiliated lender is one provider among others and receives no algorithmic priority.
- The customer pays no Furlong financing-access fee for readiness, verified-provider comparison, exact-recipient case-room handoff, or closing-status coordination through keys/logbook.
- Furlong takes no referral fee, success percentage, or transaction percentage from the financing outcome.
- Provider payment may fund infrastructure or services but never public inclusion, placement, rank, a lead, or access to a customer file.
- Provider-published box evidence and stated turnaround expectations remain distinct from Furlong-measured execution history.

These rules are the current executable interpretation of `CONST-FAIR-001`, `ECON-CONFLICT-001`, `ECON-CONFLICT-REG-001`, `FACILITATION-001`, `CANON-FACILITATE-001` and the lender/provider operational doctrines.

## 6. Provider execution reliability

Furlong may maintain an evidence-backed record of how providers execute Furlong cases. The record may use verified milestones and outcomes such as first response, provider disposition and closed/funded status. It may not use borrower personal-financial profile, provider compensation, affiliation or quoted interest rate as a provider-ranking input.

Customer-facing performance metrics require at least **5 verified Furlong outcomes**. Execution history may affect ordering only as a tie-break between otherwise-equal property/program/provider suitability scores and only when **both providers have at least 10 verified provider-decision outcomes**. Borrower withdrawals and property/program/third-party/external blocks are separately counted and excluded from the provider close-rate denominator.

## 6.1 Living Furlong Case, managed handoff and actual outcomes

The canonical Furlong Case carries one customer-controlled matter from property analysis through feasibility, readiness, provider comparison, case-room consent, diligence, closing, keys and later operating-logbook continuity. Saving the case shares nothing with a provider. Material case events are append-oriented and replay/evidence referenced.

A private provider comparison is bounded. Each provider receives a separate expiring case room only after exact-recipient package consent and recipient verification. Providers return structured responses, and Furlong tracks the closing path through `KEYS_AND_LOGBOOK`.

Furlong may preserve verified actual outcomes—including response/disposition, reason category, conditions, financing structure, actual rate/project cost when authorized, environmental outcome, and closing dates—as evidence-backed learning. This data does not create autonomous Furlong credit authority and remains subject to the execution-reliability sample and neutrality rules above.

## 6.2 Customer experience, economics and security claims

The customer-facing decision hierarchy is **what Furlong found → why it matters → what to do next → show the evidence**. The first screen may be simple without weakening auditability because supporting evidence, assumptions and governance remain progressively available.

Institutional subscriptions, licensing, workflow infrastructure, APIs/integrations, analytics, governance tooling, support and enterprise environments are the primary revenue model. Optional professional or archival services are separate. Borrower lead sale, file auction, paid ranking, hidden referral economics, success percentages, transaction cuts and customer-data sale are prohibited.

Security architecture alone may not be described as unrestricted production assurance. Production claims require current threat-model, scan, IAM/isolation, key/secret rotation, backup/restore/replay, penetration, incident/rollback, vendor and signed promotion evidence. Missing evidence keeps the affected live action blocked.

## 7. Property intelligence and valuation

The current property-intelligence amendments remain controlling. Residential, farm/agricultural, commercial/hospitality and bare-land valuation methods are asset-type specific. Residential FHFA HPI must never be applied to commercial, hospitality, farm or bare-land assets. Unsupported numeric valuation is prohibited; the platform must instead state the missing property-specific evidence.

The deterministic operating model is property/project-side math. AI may interpret and challenge assumptions but may not replace the deterministic calculation, make a credit decision or introduce personal-financial scoring into the nonresidential model.

### 7.1 Property-use integrity and agricultural scope

A county land-use classification describes the current assessment/land-use record; it is **not** a highest-and-best-use conclusion. Likewise, an agricultural enterprise ranking is only one branch of property feasibility and must never be presented as though a crop choice were the property-wide best use.

For farm and land properties, Furlong must preserve these boundaries:

- Verified acreage is a controlling agricultural-ranking input. If acreage is unavailable, Furlong must fail closed rather than allow prime-soil status or county crop data to manufacture a leading enterprise.
- Prime farmland or a favorable NRCS capability class establishes agricultural capability; it does not by itself make commodity row crops the best use.
- Commodity row crops may rank as a genuine agricultural anchor when tract scale and supporting soil/yield/economic evidence justify that result. On smaller tracts they may remain a rotation, rental, or component without being labeled the property's best use.
- Gross revenue, net operating margin, startup capital, and long-cycle value are different economic measures. Furlong may show them together only when the basis is clearly labeled; it may not rank unlike measures as if they were directly interchangeable.
- Imported-address workflows must reconcile the resolved parcel acreage and land-use/zoning record into the agricultural screen before publishing its ranking. Parallel source retrieval may not leave the ranking on an earlier `acres = unknown` state after the official parcel record has resolved.
- Property-wide highest/best-supported use must separately test legal permissibility, physical feasibility, entitlement/infrastructure, market demand, timing, and economics. Development, subdivision, agritourism, renewable-energy/storage, conservation, and other alternatives may not be downgraded merely because the property is rural.
- Zoning interpretation is jurisdiction-specific and source-cited. If Furlong does not have an exact supported jurisdiction/code interpretation, it must show the raw code and require official verification rather than inventing a use meaning.

The customer-facing farm lane therefore uses **Agricultural enterprise screen** / **Leading ag screen** terminology rather than `BEST FIT` or a crop-level `highest-and-best-use` label. Property-wide alternatives are displayed separately with their zoning/evidence dependencies.

## 8. Current governance and provider identity

Furlong is owner-controlled under the current governance transition. The retained external broker workspace remains a transition/provider instance only and confers no ownership, treasury, governance, architecture or default-routing authority. Current provider identity and case access are provider-scoped and consent-scoped.

## 9. Current schema and proof surface

The canonical source schema target for this build is **0062**. Migration `0056_capital_network_multi_provider.sql` establishes the multi-provider network and provider-bound deal rooms. Migration `0057_capital_network_execution_reliability.sql` establishes evidence-backed provider execution records. Migration `0058_furlong_case_lifecycle.sql` establishes the customer-controlled Furlong Case lifecycle. Migration `0059_managed_provider_handoff.sql` adds expiring case rooms, provider responses and closing milestones. Migration `0060_furlong_case_living_record_upgrade.sql` adds the append-oriented case timeline and actual-outcome records. Migration `0061_capital_network_published_credit_box.sql` adds source-governed provider published-box, collateral, environmental and turnaround evidence. Migration `0062_identity_verifications.sql` preserves the previously implemented identity-verification schema after collision-free renumbering. Migrations 0058–0062 remain subject to controlled environment promotion and must not be described as deployed before migration evidence exists.

Standing implementation/proof anchors include:

- `src/lib/capital-graph/programRegistry.ts`
- `src/lib/financing/pathwayEngine.ts`
- `src/lib/readiness/readinessAssessment.ts`
- `src/lib/financing/capitalNetworkRuntime.ts`
- `src/lib/financing/capitalNetworkExecutionReliability.ts`
- `src/lib/property/propertyOperatingModel.ts`
- `src/lib/property/marketValueIndication.ts`
- `src/lib/property/farmAnswerEngine.ts`
- `src/lib/property/propertyBriefIntelligence.ts`
- `src/lib/property/zoningUseCurated.ts`
- `src/app/api/public/property-facts/route.ts`
- `src/components/property/lanes/FarmAgricultureTab.tsx`
- `src/lib/db/canonicalGovernanceMigrations.ts`
- `src/lib/db/migrations/0056_capital_network_multi_provider.sql`
- `src/lib/db/migrations/0057_capital_network_execution_reliability.sql`
- `src/lib/db/migrations/0058_furlong_case_lifecycle.sql`
- `src/lib/db/migrations/0059_managed_provider_handoff.sql`
- `src/lib/db/migrations/0060_furlong_case_living_record_upgrade.sql`
- `src/lib/db/migrations/0061_capital_network_published_credit_box.sql`
- `src/lib/db/migrations/0062_identity_verifications.sql`
- `src/lib/platform/furlongVision.ts`
- `src/lib/intelligence/furlongCaseStore.ts`
- `src/db/schema/furlongCases.ts`
- `src/lib/financing/managedProviderHandoff.ts`
- `docs/MASTER_VOLUME_AMENDMENT_2026-09-05_PLATFORM_EXPERIENCE_ECONOMICS.md`
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
- `npm run verify:farm-use-integrity`
- `npm run verify:furlong-vision`
- `npm run verify:managed-provider-handoff`
- `npm run verify:furlong-case`
- `npm run verify:capital-network-credit-box`
- `npm run verify:customer-property-experience`
- `npm run build`

## 10. Final parity rule

If this amendment, the machine mirror, the requirement/reconciliation matrices and executable runtime disagree, **the discrepancy is a build defect**. `verify:master-volumes` must fail until the Series and build are reconciled. Historical PDFs remain immutable evidence of prior doctrine versions; they do not silently override a later scoped amendment registered as current.
