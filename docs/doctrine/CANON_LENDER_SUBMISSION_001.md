# CANON-LENDER-SUBMISSION-001 — Governed Lender Submission

Status: implemented for sandbox testing; live delivery blocked.

Furlong may build and review a lender submission only as an immutable, versioned package. Each item uses a frozen source reference, stable canonical name, stable ordering, byte length, media type, data category, and SHA-256 digest. The canonical JSON manifest has its own SHA-256 digest. Any change creates a new version and invalidates earlier consent.

Customer authorization binds to the exact package version and manifest hash, named lender, verified recipient scope, purpose, channel, data categories, disclosure version and hash, capture time, expiry, and revocation posture. Consent never implies approval, underwriting, a credit decision, or a lender commitment.

Dispatch is fail-closed. Every promotion, kill-switch, integrity, consent, identity, recipient, certification, classification, human-review, runtime/secrets, idempotency/outbox, ledger/replay, and observability gate must explicitly pass. Missing, stale, conflicting, unknown, or errored evidence denies dispatch. Raw addresses and URLs are not dispatch inputs; only a governed recipient-verification identifier is accepted.

Delivery truth is explicit: ATTEMPTED, PROVIDER_ACCEPTED, DELIVERED, ACKNOWLEDGED, FAILED, or UNKNOWN. UNKNOWN is never retried and requires reconciliation. Transient-safe failures may retry with the same idempotency key at most five times. Evidence is append-only and replayable.

Production delivery is not implemented or enabled. Only `sandbox-v1` is certified by this build. A separate, reviewed controlled-promotion decision is required before any live adapter, credential, network path, or external recipient may be enabled.
