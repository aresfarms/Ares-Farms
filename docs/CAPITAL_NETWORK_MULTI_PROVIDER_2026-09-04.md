# Furlong Capital Network — Multi-Provider Architecture

**Effective:** 2026-09-04  
**Status:** Current owner-controlled build doctrine  
**Runtime version:** `capital-network-runtime-v1.0.0`

## Purpose

Furlong is a case-centered one-stop platform, not a single-broker funnel. A borrower may use one Furlong case to organize property/business analysis, financing readiness, environmental work, documents, program navigation, and professional-provider handoffs. Multiple commercial finance brokers and funding institutions may participate in the Capital Network under governed, replaceable provider identities.

Furlong owns the case orchestration and customer experience. Each broker, lender, CDC, Farm Credit institution, or other funding provider retains its own regulated/professional decisions. Furlong Core does not make the provider's credit decision, price a loan, issue a commitment, or determine final program eligibility.

## Provider lifecycle

Provider onboarding is a controlled lifecycle: `APPLICANT → DUE_DILIGENCE → CERTIFIED_ACTIVE`, with `SUSPENDED` and `RETIRED` fail-closed states. A provider application creates no listing, borrower-data access, routing entitlement, compensation right, or endorsement.

Before certification, the record must show verified professional/institutional authority, a certified delivery/connector posture, executed participation terms, an executed data agreement, an approved compensation/conflict posture, and governed geography/program appetite. Missing gates block activation.

## Declared appetite

Each provider profile can declare states, programs, financing purposes, property types, industries, borrower types, minimum/maximum deal size, direct-borrower acceptance, and brokered-deal acceptance. Provider profile versions are preserved so a match can identify the exact appetite version used.

## Lender-neutral matching

The Capital Network matching runtime compares coarse case facts to declared provider appetite. A provider must be `CERTIFIED_ACTIVE` and matching-enabled before it can appear in automatic borrower matching.

Geography and program coverage are required fit gates. Deal amount, purpose, property type, industry, and borrower type refine the fit. Matching is advisory only and cannot approve, decline, underwrite, price, or generate adverse action.

An affiliated future Furlong lending company receives no scoring preference. Affiliation is deliberately absent from the scoring formula. Equal matches use deterministic neutral ordering rather than ownership preference.

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

The multi-provider data model, onboarding API and UI, lender-neutral match runtime, borrower match/selection surface, provider-specific deal-room boundary, exact-provider lender-submission binding, and retained-broker compatibility path are implemented in the application build.

No newly researched lender candidate is represented as a certified Capital Network provider merely because outreach occurred. No direct federal lender approval is inferred. No production lender-delivery adapter is promoted by this build. Provider certification, contracts, licensing/authority evidence, and production delivery remain real-world controlled gates.

## Master Volume traceability

This architecture implements the existing Furlong governance chain rather than creating a competing doctrine: `CONST-FAIR-001` lender neutrality; `CONST-ARCH-001` module/provider isolation; `CONST-ID-001` accountable identity; `CONST-PATHWAY-001` financing pathway integrity; `REG-STATE-001`, `REG-LICENSE-001`, `REG-TPRM-001`, `REG-KYC-001`, `REG-OFAC-001`; `OPS-LENDER-001`; and the canonical consent, classification, treasury, replay, observability, source, and simulation controls.
