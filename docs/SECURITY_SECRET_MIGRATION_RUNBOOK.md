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

Run an ingestion command with only the named short-lived process environment
variable loaded from Secret Manager (values are not persisted locally). The
helper refuses to inject the entire governed inventory:

```text
npm run with:staging-secrets -- --secret=EIA_API_KEY -- npm run ingest:eia-electricity
```

Review the selection without accessing Secret Manager or starting the command:

```text
npm run with:staging-secrets -- --plan --secret=EIA_API_KEY -- npm run ingest:eia-electricity
```

## Rotation evidence

For provider-issued API credentials:

1. Create a replacement credential at the provider.
2. Add the replacement as a new enabled Secret Manager version using stdin or
   the provider console; never put it in source, command arguments, or output.
3. Exercise the intended connector with the replacement.
4. Disable or revoke the old provider credential.
5. Record a non-secret evidence reference (provider event ID, dated operator
   record, and passing connector check) in a JSON artifact under `artifacts/`.
6. Set `rotationStatus` to `ROTATED`.

The evidence artifact must bind the provider event to the governed secret and
GCP project, name the activated Secret Manager version, affirm that the old
provider credential was revoked, reference a passing connector check, affirm
that no secret value was displayed, and preserve
`combinedProductionReady=false`. A missing, unrelated, or malformed evidence
path fails verification.

For `REPORT_SIGNING_SECRET`, retain the previous verification key/version for
already-issued attestations, deploy a new explicit secret version, verify a new
Cloud Run revision, and only then retire the previous signing version under the
report-attestation retention policy.

Run the readiness check:

```text
npm run verify:external-secret-readiness
npm run verify:secret-rotation-evidence
```

The check fails closed if any governed credential remains pending or a rotated
entry lacks evidence.
