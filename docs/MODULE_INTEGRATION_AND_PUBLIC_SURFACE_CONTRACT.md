# Module Integration and Public Surface Contract

This document is the canonical integration contract between the governed backend,
internal operational modules, public-facing websites, federated institutional
surfaces, and future standalone deployments.

It incorporates:

- `Ares_Furlong_Module_Integration_Expansion_Requirements.docx`
- `Ares_Furlong_Platform_Integration_Architecture.docx`
- `Ares_Furlong_Master_Volume_Conformance_Testing_Framework.docx`
- `Furlong_Volume_VI_Source_Intelligence_Integration_Master.pdf`
- `Volume_VI_Consolidation_and_Changes_Summary.md`
- `Furlong_Build_Conformance_Cross_Reference_Matrix.pdf`

## Governing Interpretation

The backend is the constitutional runtime spine.

The internal modules are governed operational verticals.

Borrower, lender, sponsor, and public-facing websites are governed translation
layers.

No frontend, portal, public site, partner surface, or standalone deployment may
bypass the governed backend runtime.

Volume VI is the canonical de-duplicated integration source. The earlier
uploaded scraper, revenue, missing-doctrine, platform-integration,
module-integration, conformance, backend-readiness, and portable-surface
documents must not be rebuilt as separate competing systems. They are absorbed
through Volume VI and proven through the Build Conformance Matrix.

Every module or surface must therefore have:

- a module manifest,
- DTO/view-model boundaries,
- event-contract or handoff mapping where it crosses module lines,
- claims/redaction/public-safety posture,
- replay and audit posture,
- production-block posture,
- a conformance matrix requirement entry,
- a passing `verify` or `smoke` command.

## Required Runtime Flow

```text
Module UI
-> module API route
-> governance guard
-> permission check
-> canonical service
-> audit event
-> replay/reference metadata
-> response DTO/view model
```

## Implemented Build Surfaces

| Requirement | Implementation |
| --- | --- |
| Module Manifest Layer | `src/lib/modules/moduleRegistry.ts` |
| Shared DTO/View Model Layer | `src/lib/dto/` |
| Event Contract Registry | `src/lib/modules/eventContractRegistry.ts` |
| Shared Case Context Layer | `src/lib/modules/caseContext.ts` |
| Public Surface Gateway | `src/app/api/public/surfaces/route.ts` |
| Public Source Intelligence DTO Layer | `src/lib/dto/publicSourceIntelligence.ts` |
| Public Source Intelligence API Helper | `src/lib/source-stack/publicSourceIntelligenceApi.ts` |
| Cross-Module Handoff Map | `src/lib/modules/handoffMap.ts` |
| Kill Switch and Feature Flag Governance | `src/lib/modules/featureFlagGovernance.ts` |
| Platform Shell | `src/components/platform/PlatformShell.tsx` |
| Module Navigation | `src/components/platform/ModuleNav.tsx` |
| Integration Smoke Layer | `npm run smoke:integration` |
| Master Volume Requirement Matrix | `docs/master-volume-requirements.json` |
| Master Volume Conformance Command | `npm run verify:master-volumes` |

## Module Manifest Contract

Each vertical module manifest must declare:

```text
id
route
audience
permissions
dataDependencies
publicSurfaceAllowed
productionBlocked
claimsProfile
replayRequired
```

The manifest may also include title, module number, adjacent modules, published
events, consumed events, and feature flags.

## DTO and Public-Safe View Model Contract

Raw backend records must not be exposed directly to public, borrower, lender, or
sponsor surfaces.

Audience-specific DTO layers live under:

```text
src/lib/dto/internal/
src/lib/dto/borrower/
src/lib/dto/lender/
src/lib/dto/sponsor/
src/lib/dto/public/
```

Public-safe view models may expose only translated status, route, audience,
claims profile, production block posture, public-surface posture, and replay
posture.

## Event Contract Contract

Every governed cross-module event must declare:

```text
eventType
producerModuleId
consumerModuleIds
classificationLevel
replayRequired
publicSurfaceAllowed
productionBlocked
payloadFields
purpose
```

Known event contracts include:

```text
application.review.requested
document.metadata.received
notice.packet.prepared
connector.certification.checked
promotion.gate.blocked
rule.overlay.evaluated
review.transition.approved
report.advisory.prepared
data.rights.export.prepared
public.surface.viewed
```

## Shared Case Context Contract

The shared case context layer must preserve:

```text
case_id
borrower_id
application_id
property_id
current_stage
active_holds
related_modules
audit_refs
replay_refs
classification
```

The Case Command Center remains the operational coordination layer for this
context.

## Public Surface Gateway Contract

All public-safe API surfaces must live under:

```text
/api/public/*
```

The public gateway must enforce:

```text
classification filtering
claims governance
audience permissions
redaction rules
audit logging
rate limiting posture
public-safe response formatting
```

Current implementation:

```text
/api/public/surfaces
/api/public/grants
/api/public/property-discovery
/api/public/equipment
/api/public/market-context
/api/public/weather-risk
```

This gateway returns redacted translation-layer metadata and public-safe
source-intelligence DTOs only. It does not return raw backend records, direct
borrower/application/property identifiers, credentials, raw source payloads,
permissions, backend dependencies, official reports, public verification claims,
approval claims, live-action claims, live external fetch claims, or
production-live claims.

## Cross-Module Handoff Contract

Required handoffs are formally mapped:

```text
documents -> reviews
reviews -> decisions
decisions -> notices
rules -> decisions
connectors -> source-ingestion
audit-replay -> evidence-packets
data-rights -> reports
module-readiness -> promotion
```

All handoffs remain replay-required, human-review bounded, and production
blocked until the relevant production/live-action gates pass.

## Feature Flag Contract

Every module and public surface must support:

```text
module_enabled
public_surface_enabled
production_live_enabled
external_actions_enabled
payment_capture_enabled
notice_send_enabled
raw_document_processing_enabled
```

Current default posture:

```text
module_enabled = true
public_surface_enabled = false
production_live_enabled = false
external_actions_enabled = false
payment_capture_enabled = false
notice_send_enabled = false
raw_document_processing_enabled = false
```

This means modules and translation layers may exist for governed internal and
structural use while production-live/public reliance remains blocked.

## Standalone Deployment Contract

Future standalone deployment may use this target architecture:

```text
apps/platform
apps/borrower-portal
apps/lender-portal
apps/sponsor-portal
apps/public-verification

packages/shared-ui
packages/shared-api
packages/governance-client
```

No standalone app may own the ledger, replay engine, claims engine, canonical
governance records, or global permissions infrastructure.

## Verification Commands

```bash
npm run smoke:integration
npm run smoke:modules
npm run smoke:platform
npm run smoke:public-surfaces
npm run smoke:module-registry
npm run smoke:claims-public
npm run smoke:replay-cross-module
npm run smoke:cross-module-replay
npm run smoke:redaction
npm run smoke:content-claims
npm run verify:master-volumes
npm run verify:missing-doctrines
npm run smoke:missing-doctrine-apis
npm run verify:scraper-source-intelligence
npm run smoke:scraper-source-apis
npm run verify:modules
npm run verify:classification
npm run verify:ledger
npm run verify:replay
npm run verify:claims
npm run verify:backend
npm run build
```

## Missing Doctrine Runtime Extension

The integration contract now includes the supplemental
`Ares_Furlong_Missing_Doctrines_Implementation_Master.pdf` doctrine layer.

The additional canonical backend surfaces are:

- `src/lib/governance/constitutionalDoctrineRuntime.ts`
- `src/lib/governance/constitutionalDoctrineApi.ts`
- `src/db/schema/missingDoctrineGovernance.ts`
- `src/scripts/missingDoctrineConformanceSuite.ts`

The additional governed API families are:

- `/api/runtime/*`
- `/api/features/*`
- `/api/claims/*`
- `/api/incidents/*`
- `/api/config/*`
- `/api/ux/*`
- `/api/implementation/*`

The additional proof command is:

```bash
npm run verify:missing-doctrines
```

## Scraper And Source Intelligence Extension

The integration contract now also includes the supplemental scraper,
property-discovery, and institutional source-intelligence doctrine layer:

- `Ares_Furlong_Scraper_Connector_Source_Ingestion_Governance_Doctrine.pdf`
- `Ares_Furlong_Property_Discovery_Scraper_Governance_Integration_Master.pdf`
- `Ares_Furlong_Institutional_Scraper_Source_Intelligence_Implementation_Master.pdf`

The canonical backend surfaces are:

- `src/lib/source-intelligence/sourceIntelligenceRuntime.ts`
- `src/lib/source-intelligence/sourceIntelligenceApi.ts`
- `src/db/schema/scraperSourceGovernance.ts`
- `src/lib/db/migrations/0030_scraper_source_governance.sql`
- `src/lib/scrapers/`
- `src/lib/source-ingestion/`
- `src/lib/property-discovery/`
- `src/lib/canonical-properties/`
- `src/lib/provenance/`
- `src/lib/gis/`
- `src/scripts/scraperSourceConformanceSuite.ts`
- `src/scripts/scraperSourceApiSmokeTest.ts`

The governed API families are:

- `/api/scrapers/*`
- `/api/source-ingestion/*`
- `/api/properties/*`

The translation surfaces are:

- `/portal/property-discovery`
- `/lender/property-opportunities`
- `/sponsor/project-discovery`

These surfaces must remain advisory, source-authority-visible,
replay-referenced, disclosure-bound, human-review-bound, and production blocked.
They may not claim property approval, lender commitment, official collateral
certification, public verification authority, direct scoring reliance, or
underwriting authority.

The proof commands are:

```bash
npm run verify:scraper-source-intelligence
npm run smoke:scraper-source-apis
```

## Revenue Source Intelligence Extension

The integration contract now includes the supplemental revenue/source
intelligence doctrine layer:

- `Ares Furlong Revenue Source Intelligence Doctrines.docx`

The canonical backend surfaces are:

- `src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts`
- `src/lib/revenue-intelligence/revenueSourceIntelligenceApi.ts`
- `src/db/schema/revenueSourceIntelligenceGovernance.ts`
- `src/lib/db/migrations/0031_revenue_source_intelligence_governance.sql`
- `src/lib/customer-revenue/`
- `src/lib/program-graph/`
- `src/lib/sellable-catalog/`
- `src/lib/ag-products/`
- `src/lib/livestock/`
- `src/lib/regional-eligibility/`
- `src/lib/marketplace-intel/`
- `src/lib/operating-costs/`
- `src/lib/market-signals/`
- `src/lib/geospatial-governance/`
- `src/lib/data-fusion/`
- `src/scripts/revenueSourceIntelligenceConformanceSuite.ts`
- `src/scripts/revenueSourceApiSmokeTest.ts`

The governed API families are:

- `/api/revenue-intelligence/*`
- `/api/customer-revenue/advisory`

The translation surfaces are:

- `/customer-revenue`
- `/portal/revenue-opportunities`
- `/lender/revenue-opportunities`
- `/sponsor/revenue-opportunities`

These surfaces must remain advisory, source-lineage-visible,
classification-aware, replay-referenced, disclosure-bound,
human-review-bound, claims-governed, and production blocked. They may not claim
guaranteed revenue, program approval, legal permission, lender commitment,
underwriting reliance, official report authority, or live source freshness.

The proof commands are:

```bash
npm run verify:revenue-source-intelligence
npm run smoke:revenue-source-apis
```

## Canonical External Source Stack Extension

The integration contract now includes the canonical external source discovery
architecture and revenue intelligence runtime workpackage layer:

- `SOURCE_STACK_001_Canonical_External_Source_Discovery_Architecture.docx`
- `IMPLEMENTATION_WORKPACKAGES_Revenue_Intelligence_Runtime_Build.docx`

The canonical backend surfaces are:

- `src/lib/source-stack/sourceStackRuntime.ts`
- `src/lib/source-stack/sourceStackApi.ts`
- `src/db/schema/externalSourceStackGovernance.ts`
- `src/lib/db/migrations/0032_external_source_stack_governance.sql`
- `src/lib/canonicalization/`
- `src/lib/scrapers/conflict-resolution.ts`
- `src/lib/scrapers/market-signals.ts`
- `src/lib/scrapers/geo-intelligence.ts`
- `src/scripts/sourceStackConformanceSuite.ts`
- `src/scripts/sourceStackApiSmokeTest.ts`

The governed API families are:

- `/api/source-stack/*`
- `/api/programs/search`
- `/api/revenue/opportunities`
- `/api/market-signals`
- `/api/geo/suitability`

These surfaces must remain advisory, source-authority-visible,
provenance-scored, replay-referenced, canonicalization-aware,
freshness-visible, conflict-preserving, public-DTO-bound,
human-review-bound, claims-governed, and production blocked. They may not claim
source certainty, official collateral certification, program approval, legal
permission, guaranteed revenue, lender commitment, underwriting reliance, or
live source freshness.

The proof commands are:

```bash
npm run verify:source-stack-architecture
npm run smoke:source-stack-apis
```

## Production Boundary

This contract does not activate:

- production-live exposure;
- public verification infrastructure;
- official report publication;
- final lending decisions;
- notice sends;
- payment capture;
- live external calls;
- live marketplace scraping;
- live revenue source refresh;
- live canonical source-stack fetching or failover execution;
- guaranteed revenue, program approval, legal permission, lender commitment,
  or underwriting reliance claims;
- official collateral certification;
- raw document processing;
- sovereign data use beyond governed gates;
- standalone deployment.

Those remain blocked until the relevant Master Volume production gates pass.
