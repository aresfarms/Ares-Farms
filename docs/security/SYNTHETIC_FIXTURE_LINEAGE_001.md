# SYNTHETIC-FIXTURE-LINEAGE-001

## Purpose

Furlong uses unmistakably fictional names as the human-visible clue that a
record belongs to an authorized test. The name is never the authorization
boundary. The technical boundary is a signed, environment-scoped test session
plus an immutable lineage record bound to every durable test artifact.

## Required lineage

Every synthetic record carries:

- `syntheticPersonaId`
- `testRunId`
- `fixtureVersion`
- `environment`
- `operatorIdentity`
- `createdAt`
- `scenarioId`
- `recordType` and `recordId`
- deterministic `lineageSha256`

The canonical registry version and lineage-envelope version are also recorded.
The database trigger rejects updates and deletes to lineage rows.

## Canonical personas

| Visible name     | Persona ID                 | Primary use                                                       |
| ---------------- | -------------------------- | ----------------------------------------------------------------- |
| Pocohantus Smith | `syn-pocohantus-smith-001` | Professional-lane access boundaries                               |
| Tree Frog        | `syn-tree-frog-001`        | Broker intake, pro forma, document, signing, and sandbox delivery |
| Tuna Fish        | `syn-tuna-fish-001`        | Plaid, Stripe card, Apple Pay, Google Pay, and allocation testing |
| Purple Cow       | `syn-purple-cow-001`       | Negative-risk, mismatch, fraud hold, and recovery testing         |
| Rainbow Trout    | `syn-rainbow-trout-001`    | Positive full lender-lifecycle and reconciliation testing         |

## Authorization boundary

Only an authenticated operator on the synthetic-fixture allowlist may activate
a test run. Activation produces an HMAC-signed, HttpOnly, SameSite=Strict
session token. The token is bound to one persona, one scenario, one operator,
one environment, one fixture version, and one creation time.

Known fictional names are refused by broker intake unless a matching signed
fixture session is active. A signed fixture is also refused when its visible
name, operator email, scenario, or environment does not match the request.

## Production prohibition

Synthetic fixtures are staging/test infrastructure. They are forbidden in
production. The controls are redundant:

1. Terraform validation rejects production with either test switch enabled.
2. Runtime token verification rejects production and cross-environment tokens.
3. `src/instrumentation.ts` refuses server startup if a production environment
   has either synthetic-fixture switch enabled.
4. Production readiness and security audit gates test this boundary.

## Durable propagation

Lineage is propagated to the broker service request, application, document
handoff, document record, lender-submission case, package version, package
item, customer consent, recipient verification, dispatch authorization,
outbox, delivery attempt, receipt, failure, reconciliation, billing event,
Plaid authorization audit, and encrypted Plaid secure record.

Stripe test metadata carries the same identifiers so signed webhooks can
reconstruct the exact Furlong test run. Plaid authorization and token exchange
must carry matching lineage; a mismatch fails closed.

## External-action safety

Synthetic broker records never trigger real document-reminder or new-deal
email. Synthetic lender delivery is limited to the certified sandbox adapter.
Production delivery remains blocked. Stripe and Plaid use provider test/sandbox
environments. Human approval of the lender pro forma remains a separate gate
and is not implied by fixture activation.

## Existing record backfill

Founder-authorized exact-name backfill is limited to the confirmed staging
records for Tree Frog and Tuna Fish under
`chudson@aresfarmsinc.com`. Backfill appends immutable lineage and a canonical
audit event; it does not rewrite the original business record.

### Legacy broker test records

The founder-authorized backfill covers the exact historical staging names `Sam
Oranutang`, `Sammy Snake`, `Frank Furter`, `Hound Dog`, and `Shark Bait`. They
are registry entries in `LEGACY_BACKFILL_ONLY` mode and cannot be activated for
new runs. One earliest founder smoke record used `Caitlin Hudson`; it is
technically classified as synthetic through immutable lineage but remains a
visible-clue exception because rewriting historical identity data would destroy
provenance. New test runs must use the unmistakably synthetic active registry.

## Verification

- `npm run verify:synthetic-fixture-lineage`
- `npm run verify:lender-delivery-conformance`
- `npm run verify:plaid-link-security`
- `npm run verify:plaid-at-rest-encryption`
- `npm run verify:payment-fraud`
- `npm run verify:stripe-connect-allocation`
- `npm run lint:critical`
- `npm run build`

The backfill defaults to plan-only:

- `npm run synthetic-fixtures:backfill:plan`
- `npm run synthetic-fixtures:backfill` only in staging after migration `0053`
