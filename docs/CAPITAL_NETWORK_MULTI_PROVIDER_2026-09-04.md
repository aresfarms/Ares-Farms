# Furlong Capital Network — Multi-Provider Architecture

**Effective:** 2026-09-04  
**Status:** Current owner-controlled build doctrine  
**Runtime version:** `capital-network-runtime-v1.1.0`

## Purpose

Furlong is a case-centered one-stop platform, not a single-broker funnel. A borrower may use one Furlong case to organize property/business analysis, financing readiness, environmental work, documents, program navigation, and professional-provider handoffs. Multiple commercial finance brokers and funding institutions may participate in the Capital Network under governed, replaceable provider identities.

Furlong owns the case orchestration and customer experience. Each broker, lender, CDC, Farm Credit institution, or other funding provider retains its own regulated/professional decisions. Furlong Core does not make the provider's credit decision, price a loan, issue a commitment, or determine final program eligibility.

## Non-negotiable borrower-routing rules

These are hard platform rules, not marketing preferences:

- **Furlong does not sell borrower leads.**
- **Furlong does not auction borrower files.**
- **Furlong does not route based on which provider pays Furlong the most.** Compensation has zero influence on provider ranking.
- **Furlong does not shotgun a case to a large lender list.** A borrower chooses the recipient(s), and exact recipient/package consent is required before disclosure.
- **A Furlong-affiliated provider receives no preference.** Affiliation has zero scoring value.
- **For nonresidential property, Furlong does not score personal credit, personal income, household DTI, personal assets/liquidity/net worth, or other personal-financial profile data.** Furlong ranks the property/project and program/provider fit. The selected provider separately performs any borrower/business underwriting its program requires.
- **Residential is the explicit exception to the property-only personal-financial boundary.** Residential mortgage readiness may legitimately require borrower credit/income/debt/asset inputs, but Furlong still does not make the lender's credit decision.

The machine-readable mirror is `CAPITAL_NETWORK_NON_NEGOTIABLES` in `src/lib/financing/capitalNetworkRuntime.ts` and is covered by Capital Network conformance tests.

## Provider lifecycle

Provider onboarding is a controlled lifecycle: `APPLICANT → DUE_DILIGENCE → CERTIFIED_ACTIVE`, with `SUSPENDED` and `RETIRED` fail-closed states. A provider application creates no listing, borrower-data access, routing entitlement, compensation right, or endorsement.

Before certification, the record must show verified professional/institutional authority, a certified delivery/connector posture, executed participation terms, an executed data agreement, an approved compensation/conflict posture, and governed geography/program appetite. Missing gates block activation.

## Declared appetite

Each provider profile can declare states, programs, financing purposes, property types, industries, borrower types, minimum/maximum deal size, direct-borrower acceptance, and brokered-deal acceptance. Provider profile versions are preserved so a match can identify the exact appetite version used.

## Lender-neutral matching

The Capital Network matching runtime compares coarse case facts to declared provider appetite. A provider must be `CERTIFIED_ACTIVE` and matching-enabled before it can appear in automatic borrower matching.

Geography and program coverage are required fit gates. Deal amount, purpose, property/collateral type, industry, and relevant non-financial program/entity characteristics refine the fit. Matching is advisory only and cannot approve, decline, underwrite, price, or generate adverse action. Personal-financial profile fields are absent from the nonresidential match input.

An affiliated future Furlong lending company receives no scoring preference. Affiliation and compensation are deliberately absent from the scoring formula. Base suitability score always comes first.

## Execution reliability record

Furlong maintains an evidence-backed execution record because a nominal rate quote is less useful than knowing whether a provider actually responds, reaches a disposition, and closes/funds transactions of the relevant kind.

Migration `0057_capital_network_execution_reliability.sql` creates one durable provider/case execution record with provider-selection/consent/response/disposition/closed-funded milestones, final outcome, verification status, and evidence references. Capital Desk—not the provider—records the verified outcome. Personal-financial fields and compensation fields are prohibited from this dataset.

Customer-facing reliability is deliberately sample-gated. Fewer than **5 verified Furlong outcomes** displays only “not enough verified Furlong history yet.” Reliability may affect ordering only as a **tie-break between otherwise-equal suitability scores**, only after **both providers have at least 10 verified provider-decision outcomes**. A new provider is therefore not penalized merely because it is new to Furlong.

The public record can show verified close/fund count, close/fund rate for provider-decision outcomes, median first-response time, and median consent-to-close time when enough evidence exists. Borrower withdrawals and property/program/third-party/external blocks are separately counted and excluded from the provider close-rate denominator. The methodology is visible to the customer. Interest rate, compensation, affiliation, and borrower personal-financial profile never enter the reliability calculation.

## Borrower choice and consent

A borrower may select one or more certified matched providers. Selection alone shares no borrower file and grants no provider access. It creates a provider-specific deal room in `AWAITING_PACKAGE_AND_CONSENT` state.

The existing lender-submission governance pipeline remains the transmission authority. For a Capital Network submission, the submission case is bound to the selected `providerId` and financing `serviceRequestId`. The exact frozen package must then be reviewed and consented to by the borrower. The consent's provider must equal the selected provider. Recipient verification must also be bound to that provider before dispatch authorization can pass.

Only after exact package/provider consent does the provider-specific deal room become accessible. Production delivery remains separately controlled by adapter promotion, kill switches, package integrity, document authenticity, data classification, human review, replay, observability, recipient verification, and other lender-submission gates.

## Provider-specific workspaces

`/capital-network/provider` is the institution/provider-specific deal-room surface. It shows only deal rooms activated for the authenticated verified provider identity. Provider registration alone cannot enumerate Furlong financing cases.

The historical `/lender-desk` remains the commercial-broker working surface. It is now provider-scoped. A broker can see Capital Network cases only when its provider identity has an activated deal room. The retained external broker keeps historical cases previously routed to the legacy broker spoke so the transition does not destroy ongoing work.

## Retained external broker

The existing external broker workspace is represented as provider id `retained-external-broker`. It is transition-active for legacy/explicit assignment only. Automatic matching is off, public listing is off, and live-routing entitlement is off. Keeping that workspace open grants no Furlong ownership, governance, treasury, architecture, or default-routing authority.

## Discovery candidates versus providers

The lender-network discovery registry remains separate from the active provider registry. Horizon Farm Credit, Delaware Community Development Corporation, True Access Capital Corporation, 504 Capital Corporation, and future outreach targets remain candidates until they complete actual onboarding and certification. Discovery status never authorizes borrower-data transmission.

## Current truth posture

The multi-provider data model, onboarding API and UI, lender-neutral match runtime, borrower match/selection surface, provider-specific deal-room boundary, exact-provider lender-submission binding, retained-broker compatibility path, and evidence-backed execution-reliability record are implemented in the application build.

No newly researched lender candidate is represented as a certified Capital Network provider merely because outreach occurred. No direct federal lender approval is inferred. No production lender-delivery adapter is promoted by this build. Provider certification, contracts, licensing/authority evidence, and production delivery remain real-world controlled gates.

## Master Volume traceability

This architecture implements the existing Furlong governance chain rather than creating a competing doctrine. Conformance gates include `npm run verify:capital-network` and `npm run verify:capital-network-execution`. The doctrine maps to: `CONST-FAIR-001` lender neutrality; `CONST-ARCH-001` module/provider isolation; `CONST-ID-001` accountable identity; `CONST-PATHWAY-001` financing pathway integrity; `REG-STATE-001`, `REG-LICENSE-001`, `REG-TPRM-001`, `REG-KYC-001`, `REG-OFAC-001`; `OPS-LENDER-001`; and the canonical consent, classification, treasury, replay, observability, source, and simulation controls.
