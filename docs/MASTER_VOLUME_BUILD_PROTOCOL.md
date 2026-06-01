# Master Volume Build Protocol

This guide explains how the Ares/Furlong webportal build must be handled from this point forward. It is written for a non-coder operator and for any coding assistant working in the repository.

## 1. Governing Documents

The Master Volume Series is the controlling build authority. The source PDFs live here:

`/Users/caitlinhudson/Documents/Master Build Volume Documents 05-2026/`

Use these documents as the source of truth:

| Volume | File | Build Role |
| --- | --- | --- |
| Volume 0 | `Furlong_Volume_0_Platform_Orientation.pdf` | Platform identity, institutional purpose, borrower/lender positioning, executive orientation |
| Volume I | `Ares_Volume_I_Constitutional_Backbone_Master.pdf` | Constitutional authority, doctrine hierarchy, role authority, amendment control, compliance checklist |
| Volume II | `Ares_Volume_II_Regulatory_Governance_Master.pdf` | USDA/SBA/regulatory rules, adverse action, retention, policy versioning, regulatory monitoring |
| Volume III | `Ares_Volume_III_Technical_Infrastructure_Master.pdf` | Technical architecture, ledger, replay, schema singularity, implementation sequence |
| Volume III-B | `Ares_Volume_III_B_Governance_Runtime_Master.pdf` | Governance runtime, metrics, human-in-the-loop rules, observability, onboarding architecture |
| Volume IV | `Ares_Volume_IV_Operational_Runbooks_Master.pdf` | Operational runbooks, deployment sequencing, workpackages, escalation and continuity procedures |
| Volume V | `Ares_Volume_V_Canonical_Doctrines_Master.pdf` | Canonical doctrines: classification, explainability, overlays, versioning, observability, simulation, treasury, consent, source, sovereignty, economics |
| Volume VI | `Ares_Volume_VI_Source_Intelligence_Integration_Master.pdf` / `.docx` | Canonical de-duplicated authority for source intelligence, scraper governance, revenue/source intelligence, runtime governance, platform integration, module integration, conformance, backend readiness, and portable vertical surface alignment |
| Cross-Reference | `Ares_Master_Cross_Reference_Index.pdf` / `.docx` | Traceability map across all volumes; use this before building or changing modules |
| Unified TOC | `Ares_Master_Volume_Series_Unified_TOC.pdf` / `.docx` | Current master-series front matter spanning Volumes 0-VI and the Index |
| Build Conformance Matrix | `Ares_Build_Conformance_Cross_Reference_Matrix.pdf` / `.docx` | Doctrine-family to actual build artifact proof matrix with routes, schema, migrations, commands, and Built vs Built/BLOCKED status |
| Series Hub | `Furlong_Master_Series_Hub.html` | Current index of the maintained Master Series documents |
| Volume VI Changes Summary | `Volume_VI_Consolidation_and_Changes_Summary.md` | Governing change-control note for the Volume VI consolidation, de-duplication, index/TOC/hub updates, and conformance matrix expectations |

These supplemental governing inputs are also active for this build:

| Source | File | Build Role |
| --- | --- | --- |
| Customer Version | `Furlong_Customer_Version.pdf` | Customer-facing truth rules, borrower-free positioning, AI advisory-only language, audit-access language, data-use boundaries, and honest security-posture claims |
| Governance Doctrines Master Series | `Furlong_Governance_Doctrines_Master_Series.pdf` | Verification infrastructure doctrine, lender-ready claim limits, free-tier doctrine, portability doctrine, prohibited-language scanning, and deployment claim gates |
| Module Integration Expansion Requirements | `Ares_Furlong_Module_Integration_Expansion_Requirements.docx` / `.pdf` | Module manifest layer, DTO/view-model layer, event contracts, case context, public gateway, handoff map, integration smoke tests, feature flags, and final integration contract |
| Platform Integration Architecture | `Ares_Furlong_Platform_Integration_Architecture.docx` / `.pdf` | Federated module integration, PlatformShell, ModuleNav, module registry, public translation-layer architecture, and future standalone deployment architecture |
| Master Volume Conformance Testing Framework | `Ares_Furlong_Master_Volume_Conformance_Testing_Framework.docx` | Constitutional proof layer, requirement matrix, `verify:master-volumes`, per-module conformance, platform smoke, public redaction, replay, classification, ledger, and claims verification |
| Missing Doctrines Implementation Master | `Ares_Furlong_Missing_Doctrines_Implementation_Master.pdf` | Runtime states, feature activation, public claims, incidents, configuration, UX governance, and implementation traceability |
| Canonical External Source Discovery Architecture | `SOURCE_STACK_001_Canonical_External_Source_Discovery_Architecture.docx` | External source stack, source tiers, connector certification, scraper runtime, ingestion gates, provenance, canonicalization, conflict handling, failover, and public translation boundaries |
| Revenue Intelligence Runtime Workpackages | `IMPLEMENTATION_WORKPACKAGES_Revenue_Intelligence_Runtime_Build.docx` | Implementation workpackages for governed source stack APIs, canonical entities, program graph aliases, revenue opportunity aliases, market/geospatial aliases, queue health, freshness, and conformance checks |

Current governing snapshot:

- Volume 0 v14.0
- Volume I v29.0 active supplied volume; the Volume VI summary records the earlier v28.0 consolidation pass
- Volume II v23.0 compatibility state
- Volume III v25.0 active supplied volume; the Volume VI summary records the earlier v24.0 consolidation pass
- Volume III-B v4.0
- Volume IV v22.0 active supplied volume; the Volume VI summary records the earlier v21.0 consolidation pass
- Volume V v10.0 active supplied volume; the Volume VI summary records the earlier v7.0 consolidation pass
- Volume VI v1.1
- Build Conformance Matrix v1.0
- Cross-Reference Index v22.0 summary intent, with the supplied local copy still showing v21.0 in some extracted header fields

The detailed source snapshot and file hashes are recorded in:

`docs/MASTER_VOLUME_SOURCE_SNAPSHOT.md`

When the Master Volume PDFs, DOCX files, hub, or change summaries change again,
update that snapshot before building more backend. Never downgrade an already
implemented later amendment merely because a consolidation summary references an
earlier export; the latest specific volume text controls its own doctrine.

## 1A. Volume VI Consolidation Forward Rules

The `Volume_VI_Consolidation_and_Changes_Summary.md` file is now a standing
change-control input for this build.

Going forward:

- Volume VI is the canonical de-duplicated home for the fifteen supplemental
  source-intelligence, scraper, revenue, missing-doctrine, platform
  integration, module integration, conformance, build-gate, backend-readiness,
  and portable-surface documents. Do not re-implement those uploaded documents
  as separate competing architectures.
- Scraper/source mechanics live under the Volume VI source-intelligence spine;
  property-specific and domain-specific differences should be layered on top,
  not copied into parallel systems.
- Revenue scraper mechanics and revenue governance doctrines must be
  cross-referenced instead of repeated. Revenue outputs remain advisory,
  review-bound, and non-decisioning.
- Platform/module integration must follow the Part 6 pattern: module
  manifests, DTO/view models, event contracts, case context, public gateway,
  handoff map, feature flags, shell/navigation integration, and integration
  smoke tests.
- Conformance must follow the Part 7 pattern: every doctrine family maps to
  actual routes, schema, migrations, runtime files, and a `verify` or `smoke`
  command. Unknown doctrine state is not allowed.
- Build status must be explicit: `Built` only when the artifact and proof
  command exist; `Built / BLOCKED` when the governed backend exists but live
  execution remains withheld until controlled promotion.
- No public, customer, lender, sponsor, report, module, or investor-facing
  text may claim a capability that the build does not actually have. The build
  must say what exists, what is blocked, and what requires human review.

## 2. Authority Order

When rules appear to conflict, use this order:

1. Volume I constitutional rules.
2. Volume V canonical doctrines.
3. Volume II regulatory governance.
4. Volume III and III-B technical/runtime architecture.
5. Volume IV operational sequencing and runbooks.
6. Volume 0 orientation and positioning.
7. Local implementation details in the codebase.

The Cross-Reference Index is not optional. It is the map that tells us which rules apply to the module we are building.

## 3. Backend-First Gate

Backend foundation completion is now a hard rule.

No new borrower-facing, lender-facing, sponsor-facing, admin-facing, marketplace, reporting, or product module should be built until the backend governance spine is complete enough to support that module.

The backend spine must include:

- one canonical schema source under `src/db/schema/`,
- no duplicate table definitions outside the canonical schema spine,
- real schema registry, version registry, classification registry, observability event, and replay verification tables,
- durable audit and ledger foundations for governed institutional state,
- runtime guard coverage for material backend routes and services,
- version lineage for governed outputs,
- classification propagation for governed inputs and outputs,
- observability events for material actions and failures,
- replay references for state-changing, scoring, decision, report, export, billing, connector, and ledger actions,
- audit-safe errors,
- explicit human-review boundaries,
- green verification with `npm run build` and `npx tsc --noEmit`.

Frontend work is allowed only when it supports backend verification or displays backend behavior that is already governed.

## 4. Full-File Replacement Rule

All scripts and code changes must be handled as full-file replacements.

That means:

- do not tell Caitlin to replace one line,
- do not provide partial snippets as final implementation,
- do not silently edit fragments without reviewing the whole file,
- when a file changes, the final state must be considered as one complete replacement file.

For Codex work, this means using a delete-and-add or whole-file update approach. For Caitlin instructions, this means giving the full file content when manual copying is needed.

## 5. No-Drift Rule

Each work session must stay inside the current module boundary.

Examples:

- If the step is schema singularity, do not add borrower UX.
- If the step is replay verification, do not add new regulatory policy content.
- If the step is entitlement persistence, do not redesign checkout screens.

Any new issue discovered during a step should be logged as a next step unless it blocks the current module.

## 6. Required Module Checklist

Before building or changing a module, answer these questions:

1. What is the module name?
2. Is it borrower-facing, lender-facing, admin-facing, API-only, or internal runtime?
3. Which Master Volume sections govern it?
4. Which Cross-Reference Index part applies?
5. Does it write institutional state?
6. Does it need classification metadata?
7. Does it need version lineage?
8. Does it need explainability lineage?
9. Does it need observability events?
10. Does it need replay references?
11. Does it touch schema?
12. Does it require human review or escalation?
13. Does it expose borrower, lender, sponsor, marketplace, AI, report, verification, free-tier, export, portability, or security-posture language that must pass content-claims governance?
14. What commands prove it works?

If the answer to any governance question is unclear, pause and inspect the Master Volumes before coding.

## 7. Backend Governance Requirements

A backend route or service must include the proper governance substrate when it performs material work.

For governed API routes, use this pattern unless the Master Volumes require a stricter pattern:

- runtime guard,
- version runtime,
- classification runtime,
- explainability runtime when borrower, lender, AI, recommendation, scoring, or report output is involved,
- observability event,
- replay reference,
- deterministic output contract,
- audit-safe error response.

Do not promote backend functionality that bypasses these controls when it writes, transforms, reports, scores, explains, exports, bills, grants access, connects externally, or replays institutional state.

Customer-facing content, report language, module copy, AI-generated text, and
partner-facing descriptions must also pass the Content Claims Policy before a
module is considered ready. This is now a backend/module promotion gate.

Module integration and public-surface architecture are now standing build
requirements. Every vertical module must have a manifest, every public or
partner-facing surface must consume DTO/view models rather than raw backend
records, and cross-module movement must use the event contract registry,
shared case context, and handoff map.

The canonical implementation surfaces are:

- `src/lib/modules/moduleRegistry.ts`
- `src/lib/dto/`
- `src/lib/modules/eventContractRegistry.ts`
- `src/lib/modules/caseContext.ts`
- `src/lib/modules/handoffMap.ts`
- `src/lib/modules/featureFlagGovernance.ts`
- `src/lib/governance/constitutionalDoctrineRuntime.ts`
- `src/lib/governance/constitutionalDoctrineApi.ts`
- `src/app/api/public/surfaces/route.ts`
- `src/components/platform/PlatformShell.tsx`
- `src/components/platform/ModuleNav.tsx`
- `docs/MODULE_INTEGRATION_AND_PUBLIC_SURFACE_CONTRACT.md`
- `docs/master-volume-requirements.json`
- `src/scripts/masterVolumeConformanceTest.ts`
- `src/scripts/moduleConformanceTest.ts`
- `src/scripts/classificationConformanceTest.ts`
- `src/scripts/ledgerConformanceTest.ts`
- `src/scripts/replayConformanceTest.ts`
- `src/scripts/platformSmokeTest.ts`
- `src/scripts/redactionSmokeTest.ts`
- `src/scripts/missingDoctrineConformanceSuite.ts`
- `src/lib/source-stack/sourceStackRuntime.ts`
- `src/lib/source-stack/sourceStackApi.ts`
- `src/db/schema/externalSourceStackGovernance.ts`
- `src/lib/db/migrations/0032_external_source_stack_governance.sql`
- `src/scripts/sourceStackConformanceSuite.ts`
- `src/scripts/sourceStackApiSmokeTest.ts`

The Missing Doctrines Implementation Master is now a standing backend gate.
The canonical implementation surface is:

- `src/lib/governance/constitutionalDoctrineRuntime.ts`
- `src/lib/governance/constitutionalDoctrineApi.ts`
- `src/db/schema/missingDoctrineGovernance.ts`
- `/api/runtime/state`
- `/api/runtime/transition`
- `/api/runtime/restrictions`
- `/api/runtime/emergency-mode`
- `/api/features`
- `/api/features/activate`
- `/api/features/deactivate`
- `/api/features/rollback`
- `/api/claims/validate`
- `/api/claims/public`
- `/api/claims/escalate`
- `/api/incidents/create`
- `/api/incidents/escalate`
- `/api/incidents/status`
- `/api/incidents/resolve`
- `/api/config`
- `/api/config/change`
- `/api/config/rollback`
- `/api/ux/governance`
- `/api/ux/validate`
- `/api/ux/escalate`
- `/api/implementation/manifest`
- `/api/implementation/coverage`
- `/api/implementation/validate`
- `/api/implementation/certify`

The standing proof command is:

```bash
npm run verify:missing-doctrines
```

This gate proves:

- all 12 runtime states have explicit allowed actions, blocked actions, audit,
  replay, AI, connector, notice, production authority, and escalation posture;
- feature activation has declared governance ownership, constitutional tags,
  staged rollout, rollback, replay, emergency disablement, and production
  authorization controls;
- public claims have authority, scope, basis, verification status, audience,
  expiration, validation, escalation, and replay posture;
- constitutional incidents escalate when replay, sovereignty, AI, connector,
  security, disclosure, survivability, or constitutional integrity is affected;
- configuration changes are versioned, audited, replay-safe, rollback-supported,
  jurisdiction-aware, and constitutionally tagged;
- UX cannot hide governance limitations, borrower rights, human review, or
  workflow escalation;
- every material runtime capability maps back to doctrine, policy, standard,
  runbook, service, module, route, API, schema, event contract, test suite,
  runtime gate, deployment state, and certification state.

Master Volume conformance is now a standing proof gate. A doctrine cannot sit
in an unknown state. Each requirement in `docs/master-volume-requirements.json`
must be one of:

- implemented;
- intentionally_blocked;
- not_applicable;
- awaiting_controlled_promotion.

The content-claims gate enforces:

- "lender-ready" means organized against intake requirements only, not
  approved, pre-approved, creditworthy, eligible for funding, underwriting
  approved, or guaranteed acceptance;
- reports, packages, profiles, applications, and borrower outputs cannot claim
  public, external, cryptographic, or customer-verifiable verification unless
  live verification infrastructure exists;
- AI must remain advisory only and cannot be described as approving, denying,
  underwriting, determining eligibility, making credit decisions, or influencing
  adverse action;
- borrowers pay nothing for baseline borrower support;
- the free borrower tier cannot be a teaser, paywall, upsell trap, or degraded
  workflow;
- borrower portability, export, review, and transport rights cannot be hidden,
  throttled, premium-only, or degraded;
- Furlong must not claim to be a lender, investor, credit bureau, data vendor,
  underwriter, or decision-maker;
- public content must not claim ownership, sale, or monetization of borrower,
  application, loan, or personal data;
- SOC 2 Type II and FedRAMP cannot be claimed as certified, authorized, active,
  complete, or in place unless those statuses are actually achieved.

The canonical implementation surface is
`src/lib/governance/contentClaimsPolicy.ts`, with deployment smoke coverage
through `npm run smoke:content-claims`.

Credentialed Agency Ingestion is now a standing backend governance surface. Any authenticated agency, lender, government, portal, or paywalled external source workflow must prove all of the following before a session can be considered ready:

- credential vault reference only, with no raw credential storage,
- credential validity, expiry, revocation, and actor ownership checks,
- role and application-scope authorization,
- External Ingestion Whitelist verification,
- ToS compliance attestation,
- license category and purpose limitation checks,
- baseline sync evidence,
- isolation boundary confirmation,
- provenance envelope reference,
- anti-bulk-acquisition posture,
- Tier 1 advisory-only classification,
- no external request transmitted,
- no official data fetched,
- no data processed by scoring, eligibility, underwriting, or decision runtimes,
- circuit-breaker and SEV-2 posture when credentials, whitelist, or isolation fail.

The canonical implementation surface is `/api/connectors/credentialed-ingestion`, backed by `credential_vault_refs` and `credentialed_scraping_events`.

Sovereign Consent Gateway is also a standing backend governance surface. Any tribal sovereign land, tribal operator, or sovereign-controlled data workflow must preserve Level 5 controls by default unless a valid Gateway record exists. A Gateway must prove all of the following:

- affirmative initiation by an authorized tribal governance officer or authorized native operator,
- verified identity event,
- specific Application ID scope,
- named non-proprietary data elements only,
- named workflow phases only,
- active underwriting window,
- 180-day maximum duration,
- no bulk acquisition,
- no cross-transaction sharing,
- no competitive intelligence,
- no AI training access,
- no proprietary sovereign records,
- external legal context reviewed,
- compliance officer verification,
- immutable Level 5 audit record,
- no data access performed by the Gateway route,
- no scoring or underwriting use authorized by the Gateway route.

The canonical implementation surface is `/api/governance/sovereign-consent-gateway`, backed by `sovereign_consent_gateway_records`.

Scraper, source-ingestion, property discovery, and institutional source
intelligence are now standing supplemental Master Volume surfaces. The current
controlling inputs are:

- `Ares_Furlong_Scraper_Connector_Source_Ingestion_Governance_Doctrine.pdf`
- `Ares_Furlong_Property_Discovery_Scraper_Governance_Integration_Master.pdf`
- `Ares_Furlong_Institutional_Scraper_Source_Intelligence_Implementation_Master.pdf`

These inputs do not authorize free-form web scraping. They require scrapers to
operate as governed connectors:

- all output enters the Source Ingestion Gate as candidate evidence,
- source authority tier, provenance, classification, connector ID, content hash,
  jurisdiction scope, and replay reference are mandatory,
- marketplace property discovery is advisory only,
- canonical property records require provenance, replay, parcel/GIS
  reconciliation, source conflict resolution, and institutional validation,
- public property surfaces must preserve disclosure and claims controls,
- live scraping and production reliance remain blocked until replay,
  provenance, connector, sovereignty, claims, and constitutional promotion gates
  pass.

The canonical implementation surfaces are:

- `src/lib/source-intelligence/sourceIntelligenceRuntime.ts`
- `src/lib/source-intelligence/sourceIntelligenceApi.ts`
- `src/db/schema/scraperSourceGovernance.ts`
- `src/lib/db/migrations/0030_scraper_source_governance.sql`
- `/api/scrapers/*`
- `/api/source-ingestion/*`
- `/api/properties/*`
- `/portal/property-discovery`
- `/lender/property-opportunities`
- `/sponsor/project-discovery`

The proof command is:

```bash
npm run verify:scraper-source-intelligence
```

## 8. Schema Singularity Rule

Schema work must use one canonical source.

The current intended direction is:

- canonical schema modules live under `src/db/schema/`,
- `src/db/schema/index.ts` is the canonical schema barrel,
- legacy schema paths should re-export from the canonical barrel rather than define competing tables.

Do not add a new schema table without also checking:

- schema registry,
- version registry,
- classification registry,
- replay verification needs,
- observability/event needs,
- migration requirements.

## 9. Verification Commands

For TypeScript/application changes, run:

```bash
npm run verify:master-volumes
npm run verify:modules
npm run verify:classification
npm run verify:ledger
npm run verify:replay
npm run verify:claims
npm run verify:scraper-source-intelligence
npm run verify:revenue-source-intelligence
npm run smoke:modules
npm run smoke:platform
npm run smoke:redaction
npm run smoke:integration
npm run smoke:content-claims
npm run smoke:scraper-source-apis
npm run smoke:revenue-source-apis
npm run build
npx tsc --noEmit
```

For API route changes, also run a localhost smoke test when the dev server is available.

If either command fails:

1. stop,
2. read the first real error,
3. map it back to the current module,
4. fix only the blocking issue,
5. rerun verification.

## 10. Plain-English Operator Instructions

Every build step should tell Caitlin:

1. what we are changing,
2. why it matters,
3. which file is affected,
4. whether the file was already replaced or needs manual replacement,
5. which commands to run,
6. what success looks like,
7. what failure means,
8. what the next step is.

Avoid assuming coding knowledge. Use file paths, exact commands, and short explanations.

## 11. Current Build Posture

As of this protocol file:

- the project is a Next.js/TypeScript webportal build,
- Master Volume governance is active,
- backend foundation comes before new product modules,
- full-file replacement is mandatory,
- `npm run build` and `npx tsc --noEmit` are the minimum green checks,
- schema singularity, replay safety, classification, versioning, observability, explainability, and human review are standing requirements.

## 12. Next Recommended Backend Work Order

Use this order unless the Master Volumes or a blocking build error require a different sequence:

1. Finish schema singularity.
2. Replace placeholder registry schemas with real canonical tables.
3. Convert legacy schema paths into compatibility bridges.
4. Add runtime drift guard checks.
5. Expand replay verification and canonical ledger confidence.
6. Make entitlement, observability, version, classification, and replay records durable.
7. Harden connector/webhook verification.
8. Keep revenue/source intelligence advisory, replay-safe, and review-bound.
9. Only then move to larger borrower-facing, lender-facing, sponsor-facing, or admin modules.

## 13. Revenue Source Intelligence Rule

The revenue source intelligence doctrine is now part of the active build
protocol.

Revenue opportunity, sellable catalog, program graph, marketplace, input cost,
market signal, geospatial, state regulatory, customer type, and fusion outputs
must be treated as governed advisory source intelligence.

Required safe posture:

- source lineage preserved,
- classification metadata present,
- replay refs present,
- conflicts and assumptions preserved,
- human review required,
- content claims validated,
- live source refresh blocked,
- production use blocked.

Blocked until controlled promotion:

- guaranteed revenue claims,
- program approval claims,
- legal permission claims,
- lender commitment claims,
- underwriting reliance,
- official report publication,
- live source fetching.

## 14. Canonical External Source Stack Rule

The canonical external source discovery architecture and revenue runtime
workpackages are now active supplemental build requirements.

External source data from marketplaces, government records, institutional
feeds, geospatial sources, grants/programs, commodity signals, equipment
marketplaces, weather/climate, soil/water, licensing, utilities, and
infrastructure systems must remain governed advisory source intelligence.

Required safe posture:

- source authority tier preserved,
- provenance score present,
- replayability score present,
- jurisdiction tags present,
- licensing restrictions present,
- claims restrictions present,
- freshness posture present,
- canonical lineage preserved,
- source weighting preserved,
- conflicts preserved,
- public DTO safety required,
- human review required,
- live fetch blocked.

Standing proof commands:

```bash
npm run verify:source-stack-architecture
npm run smoke:source-stack-apis
```

Blocked until controlled promotion:

- live external source fetching,
- live marketplace scraping,
- official collateral certification,
- underwriting reliance,
- lender commitment claims,
- program approval claims,
- legal advice,
- guaranteed revenue claims,
- sovereign data use beyond consent gates.
