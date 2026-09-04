# Master Volume Build Protocol

This guide explains how the Ares/Furlong webportal build must be handled from this point forward. It is written for a non-coder operator and for any coding assistant working in the repository.

## 1. Governing Documents

The Master Volume Series is the controlling build authority. The source PDFs live here:

`/Users/caitlinhudson/Documents/Master Build Volume Documents 05-2026/`

Use these documents as the source of truth:

| Volume | File | Build Role |
| --- | --- | --- |
| Volume 0 | `Furlong_Volume_0_Platform_Orientation_v14.2.pdf` | Platform identity, institutional purpose, borrower/lender positioning, executive orientation |
| Volume I | `Furlong_Volume_I_Constitutional_Backbone_Master_v31.2.pdf` | Constitutional authority, doctrine hierarchy, role authority, amendment control, compliance checklist |
| Volume II | `Furlong_Volume_II_Regulatory_Governance_Master_v25.2.pdf` | USDA/SBA/regulatory rules, adverse action, retention, policy versioning, regulatory monitoring |
| Volume III | `Furlong_Volume_III_Technical_Infrastructure_Master_v25.2.pdf` | Technical architecture, ledger, replay, schema singularity, implementation sequence |
| Volume III-B | `Furlong_Volume_III_B_Governance_Runtime_Master_v4.2.pdf` | Governance runtime, metrics, human-in-the-loop rules, observability, onboarding architecture |
| Volume IV | `Furlong_Volume_IV_Operational_Runbooks_Master_v23.2.pdf` | Operational runbooks, deployment sequencing, workpackages, escalation and continuity procedures |
| Volume V | `Furlong_Volume_V_Canonical_Doctrines_Master_v10.2.pdf` | Canonical doctrines: classification, explainability, overlays, versioning, observability, simulation, treasury, consent, source, sovereignty, economics |
| Volume VI | `Furlong_Volume_VI_Source_Intelligence_Integration_Master_v1.4.pdf` | Canonical de-duplicated authority for source intelligence, scraper governance, revenue/source intelligence, runtime governance, platform integration, module integration, conformance, backend readiness, and portable vertical surface alignment |
| Volume VII | `Furlong_Volume_VII_Unified_Governance_Conformance_Matrix.pdf` | Unified governance conformance proof matrix, doctrine-to-code verification, and build-control traceability |
| Cross-Reference | `Furlong_Master_Cross_Reference_Index_v24.1.pdf` | Traceability map across all volumes; use this before building or changing modules |
| Unified TOC | `Furlong_Master_Volume_Series_Unified_TOC_v1.2.pdf` | Current master-series front matter spanning Volumes 0-VII and the Index |
| Build Conformance Matrix | `Furlong_Build_Conformance_Cross_Reference_Matrix.pdf` | Doctrine-family to actual build artifact proof matrix with routes, schema, migrations, commands, and Built vs Built/BLOCKED status |
| Series Hub | `Furlong_Master_Series_Hub_v1.1.html` | Current index of the maintained Master Series documents |
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

Current governing snapshot (machine pointer: `docs/current-master-volume-registry.json`):

- Unified TOC v1.2
- Volume 0 v14.2 current annotated
- Volume I v31.2 current annotated
- Volume II v25.2 current annotated
- Volume III v25.2 current annotated
- Volume III-B v4.2 current annotated
- Volume IV v23.2 current annotated
- Volume V v10.2 current annotated
- Volume VI v1.4 current annotated
- Volume VII v1.0 active conformance matrix
- Build Conformance & Cross-Reference Matrix v1.2
- Master Cross-Reference Index v24.1 current annotated
- Doctrine Mirror Reconciliation amendment v3 — 2026-09-02
- Current Build Parity amendment — 2026-09-04 (`MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md`)
- Canonical schema target for the current source build: 0057
- Active nonresidential rank/diagnostic runtimes: `ranking-runtime-v0.2.0` / `property-project-diagnostic-v0.2.0`

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

When rules appear to conflict, first check `docs/current-master-volume-registry.json` for a later **scoped amendment**. A registered later amendment controls conflicting older wording only within the scope it expressly amends; historical source files remain preserved. For matters not changed by a later scoped amendment, use this order:

1. Volume I constitutional rules.
2. Volume V canonical doctrines.
3. Volume II regulatory governance.
4. Volume III and III-B technical/runtime architecture.
5. Volume IV operational sequencing and runbooks.
6. Volume 0 orientation and positioning.
7. Local implementation details in the codebase.

The Cross-Reference Index is not optional. It is the map that tells us which rules apply to the module we are building. The executable parity gate `npm run verify:master-volume-build-parity` is also mandatory: a build that no longer matches the registered current Series is a failed build, even if older doctrine-count checks still pass.

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

## 15. Institutional Evidence Access Constitutional Amendment

The active amendment `docs/MASTER_VOLUME_AMENDMENT_INSTITUTIONAL_ACCESS.md` is a controlling cross-volume doctrine for institutional evidence access.

Hard rules:

- RBAC selects a lane only; ABAC decides every record request.
- Credential verification, legal/matter authority, and data scope are independent mandatory proofs.
- No professional credential number or derivative may persist after authoritative verification.
- Field redaction occurs before payload, packet, hash, timeline, or export construction.
- Compelled disclosure requires legal hold, verified authority, a deterministic scope manifest, dual control, bounded selector release, governed notice, and post-access review.
- Institutional access is continuously rechecked and automatically revoked when credential, authority, scope, or timing becomes invalid.
- The commands listed in the amendment are mandatory Cloud Build gates.


## Institutional Access Runtime Enforcement Amendment

Institutional-access doctrine is incomplete until the protected request path consumes it. Every governed evidence packet request must execute the canonical credential, authority, ABAC, field-disclosure, capability, access-ledger, and surveillance-observation controls before packet construction. Governance and administrator identities retain management authority but may not be converted into auditor identities for evidence access. The standing proof command is `npm run verify:institutional-access-runtime-enforcement`.


## Institutional Access Surveillance Orchestration Amendment

Institutional access surveillance must execute as an operational control rather than exist only as doctrine or a reusable library. Every unrevoked attorney, auditor, and governmental-official evidence grant must be reevaluated against current credential, authority, scope, expiry, denied-request, and export-volume evidence. Invalid or expired grants are revoked append-only. Anomaly findings remain review-bound and require independent closure. The protected internal route requires `INSTITUTIONAL_ACCESS_SURVEILLANCE_CRON_SECRET` and fails closed when it is absent. The standing proof command is `npm run verify:institutional-access-surveillance-orchestration`. Scheduler activation remains a separate controlled-promotion action.


### Institutional Surveillance Activation Ceremony

Scheduled institutional-access surveillance is a controlled-promotion action. Before scheduler creation or enablement, a deterministic activation packet must bind a dedicated scheduler identity, cadence between five and sixty minutes, canonical protected route, configured authentication, clean canary, rollback action, alert ownership, and two distinct governance/security approvers. Evidence recomputation remains independently paused. The standing proof command is `npm run verify:institutional-access-surveillance-activation-ceremony`.


### Institutional Surveillance Canary and Scheduler Release

Institutional-surveillance activation requires a non-mutating dry-run canary before any scheduler may be created. The canary freezes deterministic per-grant surveillance plans, records grants that would remain clean, require review, or be revoked, and proves zero grant, credential, authority, scheduler, or secret mutations. A separate release packet binds the current activation-ceremony hash, exact canary run and snapshot, route-authentication readiness, dual-control approvers, and release reason. Scheduler creation and scheduler enablement remain separate controlled-promotion actions. The standing proof command is `npm run verify:institutional-access-surveillance-canary-release`.

### Institutional Surveillance Scheduler Provisioning

A scheduler release packet does not authorize an operator to improvise infrastructure settings. Before any institutional-surveillance scheduler may be created, a deterministic provisioning manifest must bind the exact project, region, canonical job name, HTTPS target, POST method, bounded cadence, timezone, authentication reference, dedicated scheduler identity, attempt deadline, retry/backoff policy, and initial `PAUSED` state. Plaintext credentials are prohibited. A post-create attestation must prove the observed job matches the manifest, remains paused, and has executed zero times. Scheduler enablement remains a later controlled-promotion action. The standing proof command is `npm run verify:institutional-access-surveillance-scheduler-provisioning`.

### Governed Ultimate Pro Forma Preparation

The Ultimate Pro Forma is a governed internal preparation artifact, not an official lender or agency form and not a financing decision. Its runtime must recompute sources and uses, collateral totals and coverage, personal financial statement totals, revenue subtotals, NOI, margins, DSCR, working capital, and year-model shape before rendering. Every material claim must bind to a typed evidence item, and the lane-authority item must use a current official source snapshot. Full sensitive identifiers are prohibited from the PDF. The route must authenticate the actor, enforce application-level access, restrict preparation to operator/underwriter/governance/admin roles, persist the canonical report record and governance evidence, disable caching, and mark external delivery and official use as blocked. The standing proof command is `npm run verify:governed-ultimate-proforma`.

### Federal Loan Authority Continuous Monitoring

The source-refresh scheduler must monitor official SBA, FSA, USDA Rural Development, eCFR, and Federal Register loan authorities, including program catalogs, requirements, forms, handbooks, notices, rates, fees, servicing guidance, and regulations. Monitoring is official-domain-only, bounded, cryptographically versioned, and last-good preserving. A detected change emits a review-required receipt and immediately makes dependent loan guidance review-stale. Pro forma preparation must bind exact reviewed content hashes and fail when a source changed after review, failed to refresh, lacks a baseline, or no longer matches the bound hash. The standing proof command is `npm run verify:federal-loan-authority-monitor`.

### Federal Loan Authority Automatic Reconciliation

Before an Ultimate Pro Forma is generated, the runtime must read the current federal-loan authority monitor state, extract deterministic program facts, update the pro forma authority snapshot and current-program overlay, bind the exact current source hashes, and rerun all financial and evidence gates. Form versions, dates, maximums, guaranty percentages, rates, fees, thresholds, links, and enumerated requirements update automatically. Eligibility, legal, collateral, guaranty, ownership, citizenship, credit-elsewhere, environmental, flood, use-of-proceeds, refinancing, and borrower-contribution changes require review when semantic interpretation is material or uncertain. The standing proof command is `npm run verify:federal-loan-authority-reconciliation`.


## Federal Loan Authority Refresh Reliability Amendment
Official federal lending authority monitoring must be survivable under partial source failure. Each request has a bounded deadline; each run has a hard completion deadline; concurrency is bounded; required seeds are attempted before discovered documents; and every failed, timed-out, or deferred source is represented in the replayable run receipt. Successful sources remain publishable, last-good snapshots remain retained, and any timed-out cited authority is blocked from current pro forma reliance. Standing proof: `npm run verify:federal-loan-authority-refresh-reliability`.


## Federal Loan Authority Change Triage Amendment
Official-source HTML churn must not automatically invalidate lending guidance, and raw-content similarity must not automatically clear a material authority change. The monitor must derive a stable lending-authority semantic fingerprint from program clauses, forms, effective dates, amounts, rates, fees, percentages, and requirement language. Cosmetic or non-lending informational changes may be auto-cleared only with an immutable triage receipt. Lending-relevant changes remain review-bound, legally material changes are elevated, and any change lacking a prior semantic baseline fails closed. Standing proof: `npm run verify:federal-loan-authority-change-triage`.


### Step 4U — Controlled Public Surface Promotion
Public translation surfaces must expose only deterministic public aliases, public-safe provenance summaries, advisory status, and bounded governance posture. Internal source identifiers, replay references, canonical object identifiers, source-document filenames, runtime module paths, and full observability evidence remain restricted to authorized audit surfaces. Claims governance, classification, redaction, and human-review posture execute before every public response.

**Hard rule:** Promotion of public translation surfaces does not authorize lender reliance, agency reliance, official decisions, payments, notices, submissions, or any other live public action. Standing proof: `npm run verify:controlled-public-surface-promotion`.


### Step 4V — Production Promotion Readiness and Perimeter Hardening
Before final production or public-action promotion, the platform must produce a deterministic readiness packet that verifies canonical HTTPS URLs, the approved identity perimeter, secret-manager bindings, required API authentication, bounded rate limiting, credential allowlist posture, and governed administrator-only role provisioning. The packet may declare technical readiness for a human promotion decision, but it never grants launch, payment, notice, official-report, external-action, or official-reliance authority. Named release-board, constitutional, qualified release-manager, and final-activation approvals remain separate attributed human actions. Standing proof: `npm run verify:production-promotion-readiness`.


### Step 4W — Final Production Promotion Decision Packet
A final decision packet must bind the exact immutable production image, the 4V readiness packet, a hash-only credential allowlist, a bounded activation window, an attributed rollback owner, and four distinct signed human approvals: release board, constitutional authority, qualified release manager, and final activation authority. The packet may become ready for a separately executed activation ceremony, but it cannot set environment variables, release holds, activate live actions, or grant official reliance. Standing proof: `npm run verify:final-production-promotion-decision`.


### Step 4X — Cross-Functional Internal Change Verification
Every code, configuration, security, finance, underwriting, or public-communications change must originate from a frozen plain-language request and produce one immutable Internal Change Verification and Plain-Language Assurance Report. The report combines a common machine-evidence backbone with a domain-specific checklist overlay. It records the exact request version, owner, commit, immutable image, build, tests, affected routes, permissions, database and configuration changes, known limitations, unverified claims, rollback image, release invariants, and post-release regression checks.

The change owner may implement and attest but may not independently approve a constitutionally significant change. Owner-controlled technical, governance, finance, underwriting, and public-communications changes require the independent role-bound review specified by the applicable doctrine, risk tier, and release packet. No named external broker, communications participant, or former partner is a standing approval dependency. Any change to the request, evidence, code, configuration, test results, image, or report hash invalidates all prior signatures. A rejection, failed checklist item, failed regression, missing rollback, or external-review requirement keeps activation blocked.

**Hard rule:** No governed change may be activated, promoted, or relied upon without a valid frozen report, owner attestation, both required outside-group approvals, and passing post-release invariants. The report must explain in plain English what changed, what tests proved, what tests did not prove, principal risks, and how to reverse the change. Standing proof: `npm run verify:internal-change-verification`.


### Step 4Y — Owner-Controlled Cross-Functional Release Authority Addendum
Furlong is owner-controlled, but constitutionally significant release decisions remain separation-of-powers events. The implementation owner may attest to implementation but may not independently approve their own material change. Required independent reviewers are assigned by role and competence for the applicable risk domain; external professional-spoke access never creates a governance vote. The owner and designated safety authorities retain stop and rollback authority within an observed risk event. Domain objections block release until resolved or escalated.

**Hard rule:** Owner control removes personal-partner dependency; it does not remove independent review, packet binding, signature integrity, domain review, or separate activation. Release packets must fail closed whenever a required independent role is vacant or unverified. Standing proof remains the release-authority verification suite.


### Step 4Z — Governed Change Review Workspace
The platform must provide a restricted operational workspace that freezes the plain-language internal change report, binds actions to configured authorized reviewer identities, stores owner attestations and outside-group reviews as immutable signed events, reconstructs the current report deterministically, and records initial-launch authority separately. The workspace may display readiness but never activate a release. Standing proof: `npm run verify:founder-change-review-workspace`.

**Hard rule:** No unauthenticated or unassigned identity may freeze, attest, review, or record launch authority. A material change after freeze requires a new request version; existing signatures cannot be edited or silently reused.


### Step 5A — Owner-Controlled Internal Pilot Gate
The owner may conduct a testing-only internal pilot with designated test operators, including the temporarily retained external-broker workspace, without granting those testers ownership or governance authority. Caitlin remains the implementation owner and attestor. A tester may record a green light, rejection, or retest requirement against the exact frozen report hash, but a test result is not a release approval.

**Hard rule:** Pilot readiness authorizes only controlled internal testing. It does not authorize public launch, external actions, payments, notices, official reports, lender or agency reliance, or final production promotion. Any independent review required for launch remains mandatory and must be role-bound rather than person-bound. Standing proof: `npm run verify:founder-pilot-test-gate`.
