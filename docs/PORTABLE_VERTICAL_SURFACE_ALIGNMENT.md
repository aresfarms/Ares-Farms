# Portable Vertical Surface Alignment

## Purpose

This document records the structural alignment pass for internal, borrower,
lender, and sponsor vertical surfaces.

The requested `app/` structure is implemented in this repository under
`src/app/`, which is the active Next.js application folder.

The 2026-05-31 Master Volume update adds Volume VI as the controlling
integration source for source intelligence, public source DTO aliases, module
conformance, and portable vertical surface alignment.

## Internal Module Surfaces

The completed internal module set remains:

- `/governance`
- `/operator-queue`
- `/applications`
- `/documents`
- `/reviews`
- `/rules`
- `/decisions`
- `/notices`
- `/audit-replay`
- `/connectors`
- `/partners`
- `/billing`
- `/reports`
- `/promotion`
- `/case-command`
- `/evidence-packets`
- `/source-ingestion`
- `/environmental-compliance`
- `/live-scraper-activation`
- `/source-legal-review`
- `/source-promotion-packets`
- `/source-production-readiness`
- `/controlled-promotion-activation`
- `/production-portal-readiness`
- `/production-launch-evidence`
- `/deployment-environment-readiness`
- `/release-candidate-freeze`
- `/production-cutover-hold`
- `/production-release-board`
- `/exception-remediation`
- `/data-rights`
- `/module-readiness`

These are Modules 01-32 and remain governed internal surfaces.

## Borrower Portal Surfaces

The borrower portal verticals are now present:

- `/portal/borrower`
- `/portal/borrower/applications`
- `/portal/borrower/documents`
- `/portal/borrower/notices`
- `/portal/borrower/reports`
- `/portal/borrower/data-rights`

Required borrower-safe language is included:

- "Your document was received."
- "Human review is pending."
- "More information may be needed."

Borrower surfaces remain advisory, non-final, and governed by content claims.

## Lender Portal Surfaces

The lender portal verticals are now present:

- `/lender`
- `/lender/dashboard`
- `/lender/applications`
- `/lender/overlays`
- `/lender/evidence`

Lender surfaces are coordination-only. They do not create lender commitments,
underwriting decisions, approvals, eligibility determinations, or financing
reliance.

## Sponsor Portal Surfaces

The sponsor portal verticals are now present:

- `/sponsor`
- `/sponsor/dashboard`
- `/sponsor/readiness`
- `/sponsor/reports`

Sponsor surfaces are coordination-only. They do not create sponsor commitments,
borrower disclosure, official reports, or production promotion.

## Shared Library Structure

The requested shared library structure is now represented as follows:

- `src/lib/governance/`
- `src/lib/ledger/`
- `src/lib/replay/`
- `src/lib/claims/`
- `src/lib/modules/`
- `src/lib/permissions/`
- `src/lib/classification/`
- `src/lib/api/`

New stable barrels were added for:

- `src/lib/claims/index.ts`
- `src/lib/modules/index.ts`
- `src/lib/permissions/index.ts`
- `src/lib/classification/index.ts`
- `src/lib/api/index.ts`

The portable surface registry lives at:

`src/lib/modules/portableVerticalSurface.ts`

Volume VI public-safe source intelligence DTOs now live at:

`src/lib/dto/publicSourceIntelligence.ts`

and are exposed only through governed public aliases:

```text
/api/public/grants
/api/public/property-discovery
/api/public/equipment
/api/public/market-context
/api/public/weather-risk
```

## Required Vertical Surface Contract

Every portable vertical surface must carry:

- Master Volume governance alignment;
- role and record-level permission checks;
- classification metadata;
- content-claims review;
- version lineage;
- observability and audit evidence;
- replay reference or replay-safe read posture;
- human review boundary.

Every portable vertical surface must preserve these blocks:

- no official report publication;
- no final lending decision;
- no borrower notice send;
- no live external agency call;
- no unreviewed source legal/licensing approval;
- no unreviewed source promotion approval;
- no unreviewed source production readiness approval;
- no unreviewed controlled activation ceremony approval;
- no unreviewed production portal launch approval;
- no unreviewed go-live release approval;
- no unreviewed deployment environment release approval;
- no unreviewed release-candidate freeze approval;
- no unreviewed production cutover approval;
- no unreviewed production release board approval;
- no production secret activation;
- no public DNS cutover;
- no production database migration;
- no public production API exposure;
- no payment capture;
- no raw document-content processing;
- no public verification claim.

## Master Volume Alignment

This pass aligns with:

- Volume 0: audience-specific platform orientation;
- Volume I: constitutional hierarchy and accountable authority;
- Volume II: borrower, lender, sponsor, notice, payment, report, and regulatory boundaries;
- Volume III: governed backend/API consumption and replay-safe structure;
- Volume III-B: runtime governance, classification, observability, and permissions;
- Volume IV: operational handoff, escalation, recovery, and training;
- Volume V: content claims, controlled disclosure, portability, explainability, replay, and source authority.
- Volume VI: source intelligence, legal/licensing source review, public DTO boundaries, conformance, and portable vertical surface alignment.

## Current Boundary

These surfaces are structural and translation-layer ready. They do not activate
production-live behavior.

Production exposure, live external calls, final decisions, official reports,
source legal/licensing approval, source promotion approval, source production
readiness approval, controlled activation ceremony approval, production portal
launch approval, go-live release approval, deployment environment release
approval, release-candidate freeze approval, production cutover approval,
production release board approval, production secret activation, public DNS
cutover, production database migration, payment capture, notice sends, public
verification, raw document processing, and sovereign data use remain blocked
until the relevant production gates pass.
