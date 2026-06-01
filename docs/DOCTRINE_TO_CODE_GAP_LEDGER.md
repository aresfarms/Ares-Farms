# Doctrine-to-Code Gap Ledger

Generated: 2026-06-01T20:07:08.342Z

This ledger names every Master Volume requirement currently marked `awaiting_controlled_promotion`. There are no unnamed doctrine gaps in the current build.

Canonical module surface: Module 43 - Doctrine-to-Code Gap Ledger.

Route: `/doctrine-gap-ledger`

API: `/api/governance/doctrine-gap-ledger`

Smoke test: `npm run smoke:doctrine-gap-ledger`

Current posture: review-bound and controlled-promotion only. This ledger does not authorize production launch, public production API exposure, production portal launch, payment capture, borrower notice sending, official report publication, public verification, official reliance, legal advice, or live external action.

| Requirement | Title | Owner | Route | Blocked Reason | Required Evidence | Promotion Condition |
| --- | --- | --- | --- | --- | --- | --- |
| PROMOTION-GATE-001 | Production and public-action blocks | Constitutional Authority + Release Manager | /promotion | Production, public action, live external calls, payments, notices, official reports, and verification authority are intentionally blocked until controlled promotion and qualified human approval are recorded. | backend production readiness approval; security and audit readiness approval; production auth activation approval; feature flag and kill-switch review; release, rollback, monitoring, incident, support, and audit evidence; qualified constitutional authority and release manager signoff | May move from awaiting controlled promotion only after the full production gate chain through final authority, activation ceremony, post-activation verification, and reliance boundary review passes without blocked items. |
| PUBLIC-SURFACE-001 | Public surfaces as governed translation layers | Public Surface Governance Owner + Claims/Compliance Reviewer | /api/public/surfaces | Public surfaces are built as advisory DTO translation layers, but public production exposure and reliance remain blocked until claims, redaction, access, rate-limit, public-copy, and verification boundaries are approved. | public claims smoke pass; redaction smoke pass; public DTO and classification filtering review; public-copy freeze and accessibility review; rate-limit and abuse-control readiness; qualified claims/compliance approval | May promote only when every public, borrower, lender, and sponsor surface carries required disclosures and a qualified reviewer approves public exposure without reliance, approval, guarantee, or legal/regulatory claims. |
| SURFACE-GOV-001 | Public Surface Gateway and public-safe source DTO governance | Source Intelligence Governance Owner + Public DTO Owner | /api/public/grants | Public source aliases and public-safe source DTOs are implemented, but live source freshness, public verification, source certainty, and production source reliance remain blocked pending source legal, licensing, promotion, replay, and provenance approval. | source legal and licensing review; source promotion packet approval; source production readiness review; controlled promotion activation review; live scraper activation review with live fetch still disabled until approval; public DTO safety, redaction, claims, replay, and provenance evidence | May promote only after source-specific legal/ToS/licensing, live adapter certification, provenance, replay, monitoring, rollback, incident response, and qualified human source promotion approval are recorded. |
