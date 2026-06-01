# Module 27 - Production Portal Readiness Preflight Gate

Route:

`/production-portal-readiness`

API:

`/api/governance/production-portal-readiness`

This module is the production portal launch preflight layer above Module 26.
It reviews portable vertical surfaces, backend dependencies, production auth,
security, audit, replay, content claims, record access, classification,
monitoring, rollback, incident response, operator support routing, borrower
data rights, public-copy freeze, and final launch-hold posture.

## Master Volume Alignment

- Vol I: portal launch remains subordinate to constitutional authority and
  accountable controlled promotion.
- Vol II: launch review does not create approvals, underwriting reliance,
  official reports, borrower notice sends, payment capture, legal advice,
  lender commitments, sponsor commitments, agency commitments, or public
  verification authority.
- Vol III: launch preflight evidence is deterministic, replay-safe, and bound
  to governed backend dependencies.
- Vol III-B: runtime, classification, version, observability, and replay
  posture are attached to every readiness review.
- Vol IV: launch hold, operator support, incident bridge, rollback review, and
  controlled handoff are visible before production exposure.
- Vol V: content claims, data rights, portability, controlled disclosure,
  explainability, replayability, and advisory-only boundaries remain active.
- Vol VI: portable vertical surfaces and public DTO boundaries remain governed
  while live source fetches and public verification stay blocked.

## Boundary

This module is review evidence only.

It does not:

- launch the production portal,
- approve public production API exposure,
- perform live external source actions,
- capture payments,
- send borrower notices,
- publish official reports,
- provide legal advice,
- grant public verification authority,
- create official reliance.

## Required Safe Messages

- Your document was received.
- Human review is pending.
- More information may be needed.
- No production portal launch has been executed.
- No public verification authority has been granted.
- No live external source has been contacted.
- No payment capture has been enabled.
- No borrower notice has been sent.
- No official report has been published.

## Event Contract

Publishes:

- `production.portal.readiness.reviewed`

Consumes:

- `controlled.promotion.activation.reviewed`
- `source.production.readiness.reviewed`
- `module.readiness.checked`
- `promotion.gate.blocked`

## Handoffs

- Module 26 Controlled Promotion Activation Gate -> Module 27 Production Portal
  Readiness Preflight Gate.
- Module 27 -> Module 28 Production Launch Evidence Packet.
- Module 27 -> Module Readiness.
- Module 27 -> Governance.

All handoffs remain replay-required, human-review-bound, and
production-blocked.

## Verification

Run:

```bash
npm run smoke:production-portal-readiness
npm run backend:module-readiness
npm run smoke:integration
npm run build
```

Expected posture:

- every portable vertical surface has a readiness review,
- production-blocked count equals total review count,
- launch-ready count is zero,
- launch-executed count is zero,
- public-launch-allowed count is zero,
- live-external-action count is zero,
- payment-capture count is zero,
- borrower-notice-send count is zero,
- official-report-publication count is zero,
- public-verification count is zero,
- every review requires controlled promotion, qualified human approval, and
  replay.
