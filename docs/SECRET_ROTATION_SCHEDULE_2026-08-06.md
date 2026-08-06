# Furlong staging secret-rotation schedule — 2026-08-06

Authority: `TECH-VAULT-001`, `TECH-SEC-001`, and the Master Volume amendment lineage current on 2026-08-06.

This schedule creates reminders only. It does not claim or perform provider-side credential replacement. A rotation is complete only after the credential is replaced at its authority, a new Secret Manager version is validated, the superseded version is disabled after any required overlap, and non-secret evidence is recorded.

## Live cadence

- Database connection credentials: every 30 days. First reminder: 2026-09-05 15:00 UTC.
- API keys, API tokens, shared authentication secrets, signing secrets, and anonymous-token pepper: every 90 days. First reminder: 2026-11-04 15:00 UTC.
- Registered emails, usernames, and the SEC EDGAR user-agent identity are identity metadata, not replaceable credentials; they are excluded from value-rotation reminders and remain subject to access review.

## Delivery and escalation

- Secret Manager publishes `SECRET_ROTATE` events to `furlong-secret-rotation-events`.
- The durable subscription is `furlong-secret-rotation-requests`, with 14-day message retention and no automatic expiration.
- Cloud Monitoring emails the existing Furlong security channel when a request remains unacknowledged for 15 minutes.
- Do not acknowledge a message until rotation evidence has been recorded.

## Controlled completion procedure

1. Pull the pending request and identify the secret name; never print the secret value.
2. Generate or request the replacement from the authoritative provider.
3. Add the replacement as a new Secret Manager version.
4. Validate the affected runtime or connector with both old/new overlap where supported.
5. Roll a new Cloud Run revision when a service resolves `latest` only at startup.
6. Disable the superseded version after validation and any required overlap.
7. Record non-secret evidence in the governed inventory and deployment evidence path.
8. Run the secret, dependency, and release-readiness gates.
9. Acknowledge the Pub/Sub request.

## Emergency rule

Suspected compromise is not a scheduled rotation. Revoke immediately, target completion within 15 minutes, invoke the incident runbook, and preserve evidence without storing credential values.
