# Module 26 - Controlled Promotion Activation Gate

Route:

`/controlled-promotion-activation`

API:

`/api/governance/controlled-promotion-activation`

This module is the activation ceremony review layer above Module 25. It
assembles final controlled-promotion evidence for source production readiness,
change records, approver quorum, environment lock, credential release, live
adapter release, schema contract release, replay, provenance, monitoring,
rollback, incident response, audit export, claims freeze, kill switch, and
post-activation verification planning.

## Master Volume Alignment

- Vol I: activation remains subordinate to constitutional authority and
  accountable controlled promotion.
- Vol II: activation review does not create legal advice, source certainty,
  official source reliance, underwriting truth, borrower disclosure authority,
  public verification, lender commitment, or agency commitment.
- Vol III: activation ceremony evidence is deterministic and replay-safe.
- Vol III-B: runtime, classification, version, observability, and replay
  posture are attached to the activation gate.
- Vol IV: activation hold, emergency stop, rollback, incident response,
  degraded-source routing, and operator handoff are visible before promotion.
- Vol V: source authority, claims governance, public DTO safety, controlled
  disclosure, replayability, and advisory-only boundaries remain active.
- Vol VI: canonical source intelligence cannot become production-live without
  final controlled promotion activation review.

## Boundary

This module is review evidence only.

It does not:

- approve source production promotion,
- execute an activation ceremony,
- perform live external source fetches,
- contact external providers,
- provide legal advice,
- grant public verification authority,
- create official source reliance,
- authorize underwriting use.

## Required Safe Messages

- Your document was received.
- Human review is pending.
- More information may be needed.
- No legal advice has been provided.
- No live external source has been contacted.
- No public verification authority has been granted.
- No source has been promoted to production.
- No activation ceremony has been executed.

## Event Contract

Publishes:

- `controlled.promotion.activation.reviewed`

Consumes:

- `source.production.readiness.reviewed`
- `source.promotion.packet.reviewed`
- `source.legal.reviewed`
- `scraper.activation.reviewed`
- `connector.certification.checked`

## Handoffs

- Module 25 Source Production Promotion Readiness Gate -> Module 26 Controlled
  Promotion Activation Gate.
- Module 26 -> Module 27 Production Portal Readiness Preflight Gate.
- Module 26 -> Promotion.
- Module 26 -> Module Readiness.

All handoffs remain replay-required, human-review-bound, and
production-blocked.

## Verification

Run:

```bash
npm run smoke:controlled-promotion-activation
npm run backend:module-readiness
npm run smoke:integration
npm run build
```

Expected posture:

- every source-stack profile has an activation review,
- activation-ready count is zero,
- activation-executed count is zero,
- promotion-allowed count is zero,
- live-fetch count is zero,
- external-action count is zero,
- legal-advice count is zero,
- public-verification count is zero,
- all reviews require controlled promotion and qualified human approval.
