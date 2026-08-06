# Furlong staging secret-rotation schedule — 2026-08-06

Authority: `TECH-VAULT-001`, `TECH-SEC-001`, and the Master Volume amendment lineage current on 2026-08-06.

This schedule creates reminders only. It does not claim or perform provider-side credential replacement. A rotation is complete only after the credential is replaced at its authority, a new Secret Manager version is validated, the superseded version is disabled after any required overlap, and non-secret evidence is recorded.

## Risk-based cadence

- **30 days:** exceptionally privileged, recovery-sensitive, or recently exposed credentials. This currently includes authentication/session authority, signing authority, and the anonymous-token pepper.
- **60 days:** external API keys and tokens, AI/payment-provider credentials, and database passwords.
- **90 days:** lower-risk machine secrets where rotation has meaningful operational cost.
- **Immediately:** any suspected disclosure, regardless of the scheduled tier. Target containment and revocation within 15 minutes.
- Registered emails, usernames, and the SEC EDGAR user-agent identity are identity metadata, not replaceable credentials; they are excluded from value-rotation reminders and remain subject to access review.

## Delivery and escalation

- Secret Manager publishes `SECRET_ROTATE` events to `furlong-secret-rotation-events`.
- The durable subscription is `furlong-secret-rotation-requests`, with 14-day message retention and no automatic expiration.
- Cloud Monitoring emails the existing Furlong security channel when a request remains unacknowledged for 15 minutes.
- Do not acknowledge a message until rotation evidence has been recorded.

## Controlled completion procedure

1. Pull the pending request and identify the secret name; never print the secret value.
2. Look up the governed tier and adapter in `config/security/secret-rotation-policy.json`.
3. Create a replacement at the authoritative provider, or generate a cryptographically random internal secret.
4. Add the replacement as a new enabled Secret Manager version.
5. Validate the replacement before routing any consumer to it.
6. Roll affected Cloud Run services/jobs to resolve the new version, then run the connector and health canaries.
7. Schedule retirement after the policy overlap window. Suspected disclosure bypasses overlap.
8. Revoke the superseded provider credential and disable its Secret Manager version.
9. Record non-secret activation and completion evidence, then run the readiness gates.
10. Acknowledge the Pub/Sub request only when the workflow has reached a durable next state. Adapter failures remain unacknowledged and alert.

The workflow is fail-closed: provider-issued credentials require an approved provider adapter, database passwords require the controlled dual-user database adapter, and signing/session keys that lack safe dual-key verification remain manual until that application capability exists.

## Emergency rule

Suspected compromise is not a scheduled rotation. Revoke immediately, target completion within 15 minutes, invoke the incident runbook, and preserve evidence without storing credential values.
