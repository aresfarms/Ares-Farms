# Governed local-secret migration and rotation

## Purpose

Credential-like values must not remain in repository-local `.env*` files. The
approved staging store is Google Cloud Secret Manager in
`furlong-staging-499102`. Migration and rotation are separate controls:

- **Migration** copies the current credential into Secret Manager, verifies an
  enabled version, and only then removes the local assignment.
- **Rotation** invalidates the old credential at its issuing provider (or
  performs a controlled signing-key rotation) and records non-secret evidence
  in `config/security/external-secret-inventory.json`.

Migration alone does not satisfy the security-readiness gate.

## Safe commands

Plan without reading values into output or changing state:

```text
npm run secrets:migrate:plan
```

Execute the governed migration after reviewing the plan:

```text
npm run secrets:migrate
```

Run an ingestion command with short-lived process environment variables loaded
from Secret Manager (values are not persisted locally):

```text
npm run with:staging-secrets -- npm run ingest:eia-electricity
```

## Rotation evidence

For provider-issued API credentials:

1. Create a replacement credential at the provider.
2. Add the replacement as a new enabled Secret Manager version using stdin or
   the provider console; never put it in source, command arguments, or output.
3. Exercise the intended connector with the replacement.
4. Disable or revoke the old provider credential.
5. Record a non-secret evidence reference (provider event ID, dated operator
   record, or governed build-record path) in the inventory.
6. Set `rotationStatus` to `ROTATED`.

For `REPORT_SIGNING_SECRET`, retain the previous verification key/version for
already-issued attestations, deploy a new explicit secret version, verify a new
Cloud Run revision, and only then retire the previous signing version under the
report-attestation retention policy.

Run the readiness check:

```text
npm run verify:external-secret-readiness
```

The check fails closed if any governed credential remains pending or a rotated
entry lacks evidence.
