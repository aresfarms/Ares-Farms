# LENDER-SUBMISSION-001 implementation and threat matrix

## Doctrine to code

| Control | Implementation | Verification | Status |
|---|---|---|---|
| Immutable case/package/evidence | `src/db/schema/lenderSubmissions.ts`; migration `0045_lender_submission_governance.sql` | `verify:schema`, `verify:lender-submission-doctrine` | Built |
| Deterministic package, per-item and manifest SHA-256 | `src/lib/lender-submission/runtime.ts` | `verify:lender-package-determinism` | Built |
| MIME, malware, classification, overlay, and redaction admission | `buildDeterministicPackage` | `verify:lender-delivery-conformance` | Built; depends on upstream evidence supplied with frozen source refs |
| Exact package/lender/recipient/purpose/channel/category consent | canonical consent registry and `persistConsent` | `verify:lender-consent-binding` | Built |
| Recipient verification | fingerprint-only registry; V2/V3 authorization requirement | `verify:lender-recipient-verification` | Built |
| Server-derived fail-closed gates | `authorizeAndPersist`, `authorizeDispatch` | `smoke:lender-delivery-fail-closed` | Built |
| Canonical immutable audit event | `writeAuditEvent` before authorization/outbox commit | audit-chain v2 plus lender conformance | Built |
| Atomic authorization + outbox | one database transaction and unique idempotency key | migration constraint and conformance source inspection | Built |
| Sandbox adapter/no network | `dispatchWithSandboxAdapter` | `smoke:lender-submission-sandbox` | Built |
| Truthful delivery, retry, dead-letter, reconciliation | attempts, receipts, failures, outbox; deterministic jitter; five-attempt ceiling | `verify:lender-delivery-replay`, `verify:lender-delivery-conformance` | Built |
| Live promotion | explicit rejecting promotion endpoint; production gate always fails | production-denial test | BLOCKED |

## Threat model findings

| Threat | Control | Residual posture |
|---|---|---|
| Client submits fabricated PASS gates | API input is ignored; gates are derived from database and canonical runtime state | Sandbox authorization still requires authenticated authorized role and matching case/customer evidence |
| Raw email/URL bypass | dispatch accepts only `recipient_verification_id`; destination is fingerprinted and not retained | Live adapter destination resolution is not implemented |
| Package altered after consent | consent binds active package UUID and manifest SHA-256; rebuilt package invalidates the former version | New consent is mandatory |
| Duplicate or concurrent send | authorization creates the outbox atomically; unique idempotency key and conditional PENDING claim | Provider-side idempotency must be certified before live promotion |
| Timeout causes double-send | before-acceptance timeout may retry with backoff; after-acceptance/UNKNOWN never retries and enters reconciliation | Human reconciliation is mandatory |
| Forged/replayed callback | no external webhook is accepted; sandbox receipts are synchronous and provider event IDs are unique | A future live adapter needs signature/certificate verification and replay-window tests |
| Expired/revoked consent or recipient | rechecked at authorization and before retry | Revocation updates are narrowly allowed; evidence remains append-only |
| Ledger unavailable | canonical audit write must succeed before authorization/outbox creation | An audit record may exist for an authorization decision whose subsequent DB transaction failed; it grants no dispatch authority |
| Production/config bypass | production environment and non-sandbox adapters fail promotion; promotion endpoint rejects activation | No live credential, network call, deployment, or infrastructure change exists in this branch |

## Human-review hold

This build is suitable for database migration review and sandbox testing. It does not activate or deploy live lender delivery. Before any live-adapter work, require dual human promotion approval, lender/adapter certification, destination-control proof, authenticated webhook conformance, provider idempotency evidence, secrets/runtime readiness, alerting, load/restore testing, and a new threat-model review.
