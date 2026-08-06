# Secret-rotation provider adapter contract

External providers and Cloud SQL do not share one credential-management API.
Furlong therefore uses narrowly scoped, provider-owned adapters instead of
giving the central rotation worker a universal administrator credential.

## Security boundary

- Adapter URLs must use HTTPS and contain no embedded credentials, query data,
  or fragments.
- The worker authenticates with an audience-bound identity token.
- The adapter accepts only the governed secret/provider pair assigned to it.
- Create and retire are separate operations. Create must never revoke the old
  credential; retirement occurs only after canary validation and the overlap
  window.
- Responses and logs must never print `credentialValue`.
- A missing, malformed, or failing adapter leaves the Pub/Sub request
  unacknowledged and triggers the rotation-failure alert.

## Create replacement

`POST /v1/credentials/create`

Request fields: `rotationId`, `secretName`, `provider`, `overlapHours`, and
`requestedScope=CREATE_REPLACEMENT_ONLY`.

Successful response fields:

- `credentialValue` — returned once over the authenticated TLS channel;
- `credentialId` — non-secret identifier for the new credential;
- `previousCredentialId` — non-secret identifier for later retirement, when
  the provider exposes one; and
- `providerEventReference` — non-secret audit/event identifier.

## Retire superseded credential

`POST /v1/credentials/retire`

Request fields: `rotationId`, `secretName`, `provider`, `credentialId`, and
`requestedScope=RETIRE_SUPERSEDED_ONLY`.

The adapter must be idempotent: retrying retirement of the same credential is
success, not an attempt to retire the newly activated credential.

## Database adapter

Cloud SQL rotation must use a dual-user pattern. Create a replacement login,
grant the same narrowly scoped database roles, write a new connection-secret
version, roll and validate consumers, then retire the prior login after the
overlap. In-place password mutation is forbidden because it removes the safe
rollback path.
