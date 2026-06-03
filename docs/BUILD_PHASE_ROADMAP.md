# Ares Furlong Build Phase Roadmap

Generated: 2026-06-02

Status: Current planning control after backend governance foundation, Module 42 build preservation, and Module 43 doctrine-to-code gap ledger.

This roadmap governs the practical build order after the backend foundation. It does not authorize production launch, public verification, payment capture, borrower notice sending, official report publication, live scraping, legal/regulatory reliance, or external conformance claims.

## Current Build Baseline

- Backend governance foundation is complete for governed module work.
- Current implementation is review-bound through Module 43.
- All seven Build Now items (01 Core borrower onboarding, 02 Financing pathway engine, 03 Readiness assessment, 04 Environmental intake, 05 Opportunity discovery, 06 Public trust pages, 07 Basic lender workflow) are complete as governed, review-bound vertical surfaces.
- Build Next 08 (Governance evidence engine) is complete as a governed internal evidence composition surface. Pack output remains internal evidence unless separately promoted through governed controlled-promotion gates.
- Build Next 09 (Internal certification engine) is complete as a governed internal certification composition surface. Posture output is internal certification only — external certification claims remain blocked until the public verification and reliance gates are approved.
- Build Next 10 (Registry framework) is complete as a governed internal registry composition surface over the canonical module manifest, public surface, event contract, handoff, source authority, controlled promotion, and participant role registries. Framework output remains internal evidence unless separately promoted through governed controlled-promotion gates.
- Build Next 11 (Connector certification) is complete as a governed internal connector posture composition surface across review, certification evidence, rollback, monitoring, and activation checks. Live external connector execution remains blocked until qualified approval through the Source Promotion Authority, the Controlled Promotion Board, and the Live Scraper Activation Gate.
- Build Next 12 (Advanced intelligence modules) is complete as a governed internal advisory intelligence composition surface across source, revenue, market, geospatial, and pathway intelligence with explicit conflict-preservation. Outputs remain advisory, replay-safe, conflict-preserving, and human-review-bound.
- The full near-term roadmap (Build Now items 01-07 plus Build Next items 08-12) is now complete.
- Build 13 (Universal Capital Graph) is complete as the constitutional funding backbone. Composes the canonical capital taxonomy (23 categories), CapitalProgram registry, eligibility evaluator, and pathway matcher. Internal advisory evidence only; no autonomous lending decision, program approval, public verification, regulatory reliance, lender commitment, tax-credit allocation, environmental clearance, carbon-credit issuance, or legal reliance is created. Sovereign sponsor programs are gated behind named federation participant review. The Capital Graph becomes the funding backbone for future Customer Type Registry and Revenue Intelligence builds (Build 14 onward); each remains gated behind named human authority approval.
- Build 14 (Customer Type Registry) is complete as the borrower-side canonical taxonomy paired with the Capital Graph. Composes the 18-archetype customer-type taxonomy, CustomerType registry, and cross-reference to canonical Capital Graph eligibility. Internal advisory evidence only; no autonomous customer eligibility determination, credit decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, or legal reliance is created. Sovereign customer types require named federation participation. Together the Capital Graph and Customer Type Registry form the canonical eligibility matrix that downstream Revenue Intelligence v2 (Build 15) and Financing Pathway Engine v2 (Build 16) will consume.
- The remaining Build Later items (full institutional ecosystem, Volume VII automation, third-party certification marketplace, federated participant network, external conformance program) all sit behind production authority, participant governance, and reliance-gate approvals.
- Checkpoint `BR-2026-06-01-M41` remains the preserved backend governance checkpoint.
- Current machine-readable version registry covers Master Volumes 0-VII.
- The three awaiting-controlled-promotion items remain named, owned, routed, and blocked.
- Live external actions remain blocked.

## Build Now

These are the next practical product surfaces. They should use the existing governed backend, claims controls, classification, replay, observability, human review, and production-block posture.

| Priority | Workstream | Purpose | Existing Backend Spine | Current Safety Boundary |
| --- | --- | --- | --- | --- |
| 1 | Core borrower onboarding | Let borrowers begin, update, and understand their intake path. | `/api/apply`, `/api/onboard`, borrower portal surfaces, applications, documents, data rights | Complete as a review-bound vertical surface; no eligibility, approval, funding, legal, permitting, or regulatory determination. |
| 2 | Financing pathway engine | Translate borrower context into possible financing pathways and next steps. | rules, recommendations, ranking, revenue/source intelligence, claims runtime | Complete as a review-bound vertical surface; no approval, pre-approval, underwriting decision, guarantee, lender commitment, eligibility determination, or legal/regulatory reliance. |
| 3 | Readiness assessment | Show what is complete, what is missing, and what human review may need. | module readiness, application records, document metadata, review transitions, public claims | Readiness is operational guidance only; no official certification or public verification. |
| 4 | Environmental intake | Collect environmental context and route trigger/exemption posture. | environmental compliance runtime, source ingestion, document handoff, human review | Intake and review routing only; no official environmental report, clearance, permit, or provider engagement. |
| 5 | Opportunity discovery | Show advisory grants, programs, properties, equipment, market context, and revenue opportunities. | public source DTOs, source stack, revenue intelligence, property discovery, scraper activation blocks | Discovery intelligence only; no live scraping, source certainty, guaranteed revenue, program approval, or legal permission claim. |
| 6 | Public trust pages | Explain what Furlong is, what it is not, and what protections apply. | public surfaces, content claims, disclosure audit, data rights, build evidence archive | Public copy must carry advisory/no-approval/no-guarantee/no-reliance boundaries. |
| 7 | Basic lender workflow | Give lenders an organized review surface for applications, overlays, evidence, and borrower packets. | lender surfaces, overlays, evidence, partner workflow, claims controls | Coordination only; no underwriting reliance, lender commitment, or official credit decision. |

## Build Next

These deepen institutional readiness after the borrower/lender practical path is usable.

| Priority | Workstream | Purpose | Required Gate Before Promotion |
| --- | --- | --- | --- |
| 8 | Governance evidence engine | Turn evidence, audit, replay, and module state into reusable review packets. | Evidence Pack Generator and human authority mapping remain review-bound. |
| 9 | Certification engine | Certify internal readiness, source posture, connector posture, and module conformance. | No external certification claims until public verification and reliance gates are approved. |
| 10 | Registry framework | Formalize registries for modules, sources, public surfaces, controlled promotion, and participant roles. | Registry output remains internal evidence unless separately promoted. |
| 11 | Connector certification | Expand connector review, certification evidence, rollback, monitoring, and activation checks. | Live external connector execution remains blocked until qualified approval. |
| 12 | Advanced intelligence modules | Expand source, revenue, market, geospatial, and pathway intelligence. | Outputs remain advisory, replay-safe, conflict-preserving, and human-review-bound. |

## Build Later

These are ecosystem-scale capabilities and must not be treated as near-term launch prerequisites.

| Workstream | Purpose | Boundary |
| --- | --- | --- |
| Full institutional ecosystem | Coordinate USDA, SBA, state, lender, sponsor, and partner workflows at scale. | Requires production authority, participant governance, privacy, security, legal, and operational readiness. |
| Volume VII automation | Automate doctrine-to-code proof and conformance matrix maintenance. | Must remain subordinate to Master Volume text and human governance authority. |
| Third-party certification marketplace | Allow qualified third parties to certify or review governed artifacts. | Requires external certification doctrine, contracts, credentialing, auditability, and claims controls. |
| Federated participant network | Enable governed multi-party participation across institutions. | Requires federation governance, RBAC, connector certification, participant registry, and incident/rollback controls. |
| External conformance program | Provide external-facing conformance review and evidence exchange. | Requires public verification infrastructure, legal/compliance review, and official reliance boundary approval. |

## Immediate Next Sequence

1. Build the core borrower onboarding path into a usable vertical surface.
2. Add the financing pathway engine as advisory pathway guidance.
3. Add readiness assessment as an operator/borrower-readable completion state.
4. Extend environmental intake as governed intake and review routing.
5. Connect opportunity discovery to public-safe source DTOs.
6. Add public trust pages with strict disclosure language.
7. Add basic lender workflow surfaces for review and evidence coordination.

## Standing Rules

- The Master Volume Series remains controlling.
- Backend governance remains the spine for every surface.
- All borrower, lender, sponsor, and public outputs remain advisory unless separately promoted.
- Public claims must pass content-claims controls.
- Public and partner surfaces must preserve required disclosures.
- Human review is required where decisions, escalation, certification, or promotion are implicated.
- Live external actions, production launch, public verification, legal/regulatory reliance, payment capture, notices, and official reports remain blocked.
