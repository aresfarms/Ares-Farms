# Ticket PUBLIC-SURFACE-001 - Public surfaces as governed translation layers

Status: `awaiting_controlled_promotion`

Owner: Public Surface Governance Owner + Claims/Compliance Reviewer

Route: `/api/public/surfaces`

## Blocked Reason

Public surfaces are built as advisory DTO translation layers, but public production exposure and reliance remain blocked until claims, redaction, access, rate-limit, public-copy, and verification boundaries are approved.

## Required Evidence

- public claims smoke pass
- redaction smoke pass
- public DTO and classification filtering review
- public-copy freeze and accessibility review
- rate-limit and abuse-control readiness
- qualified claims/compliance approval

## Promotion Condition

May promote only when every public, borrower, lender, and sponsor surface carries required disclosures and a qualified reviewer approves public exposure without reliance, approval, guarantee, or legal/regulatory claims.

## Existing Evidence Files

- `src/app/api/public/surfaces/route.ts`
- `src/lib/dto/public/index.ts`
- `src/scripts/redactionSmokeTest.ts`

## Proof Commands

- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
