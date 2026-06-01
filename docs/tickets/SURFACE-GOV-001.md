# Ticket SURFACE-GOV-001 - Public Surface Gateway and public-safe source DTO governance

Status: `awaiting_controlled_promotion`

Owner: Source Intelligence Governance Owner + Public DTO Owner

Route: `/api/public/grants`

## Blocked Reason

Public source aliases and public-safe source DTOs are implemented, but live source freshness, public verification, source certainty, and production source reliance remain blocked pending source legal, licensing, promotion, replay, and provenance approval.

## Required Evidence

- source legal and licensing review
- source promotion packet approval
- source production readiness review
- controlled promotion activation review
- live scraper activation review with live fetch still disabled until approval
- public DTO safety, redaction, claims, replay, and provenance evidence

## Promotion Condition

May promote only after source-specific legal/ToS/licensing, live adapter certification, provenance, replay, monitoring, rollback, incident response, and qualified human source promotion approval are recorded.

## Existing Evidence Files

- `src/app/api/public/surfaces/route.ts`
- `src/app/api/public/grants/route.ts`
- `src/lib/dto/publicSourceIntelligence.ts`
- `src/scripts/publicSurfaceSmokeTest.ts`

## Proof Commands

- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
