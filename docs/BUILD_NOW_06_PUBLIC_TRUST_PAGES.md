# Build Now 06 - Public Trust Pages

Implemented: 2026-06-02

Status: Complete as a governed public-and-borrower-readable vertical surface. Review-bound and not production-live.

## What Was Built

- Shared public trust runtime at `src/lib/trust/trustPagesRuntime.ts` with canonical catalogs for what Furlong is, what Furlong is not, borrower protections, canonical disclosures, and production restrictions. Each evaluation runs the content text through the canonical content-claims policy and returns evidence-bound trust content.
- Public About Furlong page at `/about` explaining what Furlong is, how it works, what it is not, and what protections apply.
- Public Trust page at `/trust` surfacing the full borrower protections set with governance references, canonical disclosures, production restrictions, content-claims policy posture, and governance evidence.
- Governed API route at `/api/trust` with runtime guard, version lineage, PUBLIC classification (input + output), explainability, observability, replay verification, and evidence persistence. The output classification exports the `not-an-approval`, `not-a-credit-decision`, `not-a-public-verification`, `not-a-certification`, `not-a-payment-authorization`, `not-an-environmental-determination`, and `not-a-legal-or-regulatory-reliance` boundaries.
- Public About Furlong and Public Trust are registered as portable public/borrower surfaces with the `public-safe` claims profile.
- Module registry, event contract registry, and handoff map now include `public.trust.viewed`, the downstream readiness, financing pathway, and data rights consumer wiring, and three governed handoffs from trust to data rights, readiness, and financing pathways.
- Lightweight smoke coverage added through `npm run smoke:public-trust`.

## Master Volume Traceability

- Vol 0: presents the platform orientation translation layer in borrower- and public-safe language with required advisory and no-approval posture.
- Vol I: keeps the surface subordinate to constitutional authority; the surface explains coordination and advisory guidance only.
- Vol II: blocks public claims that imply approval, eligibility, underwriting, credit decision, lender commitment, environmental clearance, certification, public verification, payment authorization, official report publication, or regulatory or legal reliance.
- Vol III: provides deterministic, replay-safe trust content with content-claims evaluation, version lineage, and runtime evidence.
- Vol III-B: attaches runtime guard, PUBLIC classification, version lineage, explainability, observability, and replay verification.
- Vol IV: routes visitor handoffs to readiness, data rights, financing pathway guidance, opportunities, and environmental intake.
- Vol V: preserves canonical claims governance, controlled disclosure, portability, replay, and source-authority boundaries.
- Vol VI: registers the surface as a portable governed public surface with safe translation-layer copy.
- Vol VII: keeps the surface advisory and review-bound; no external conformance or verification claim is created.

## Safety Boundary

The public trust content does not create:

- approval,
- preapproval,
- eligibility determination,
- underwriting decision,
- credit decision,
- lender commitment,
- environmental clearance,
- environmental permit,
- certification,
- public verification,
- guaranteed revenue,
- program approval,
- payment capture,
- notice send,
- official report publication,
- legal or regulatory reliance,
- live external action.

It is public orientation, protections-explainer, and disclosure surface only.

## Verification

Required verification for this item:

- `npm run smoke:public-trust`
- `npm run smoke:opportunity-discovery`
- `npm run smoke:environmental-intake`
- `npm run smoke:readiness-assessment`
- `npm run smoke:financing-pathway-engine`
- `npm run smoke:borrower-onboarding-core`
- `npm run verify:module-manifests`
- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
- `npx tsc --noEmit`
- `npm run build`

## Next Sequence

Next Build Now item: Basic Lender Workflow.
