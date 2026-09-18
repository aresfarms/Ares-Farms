# TECH-PDF-EXECUTION-001

## Implemented boundary

- Canonical Drizzle schema and migration for execution cases, sealed document versions, placement plans, authority, electronic-process consent, intent, atomic authorizations, outbox/inbox, evidence, final PDFs, validation, failures, reconciliation, events, and replay references.
- Fail-closed structural analyzer for encryption, malformed PDFs, embedded files, JavaScript, launch actions, suspicious annotations, forms, and existing signature/certification indicators.
- Deterministic placement plans in PDF points with page geometry and rotation binding.
- Certified authored-template zones and a third-party path that appends an execution page inside the same PDF.
- Offline-only mock capture adapter, finalizer, reopen validator, blocker vocabulary, state transitions, and pure atomic gate evaluation.
- SHA-256 source and executed-artifact bindings. The executed PDF hash is stored beside the immutable artifact and validation report because a file cannot contain its own final cryptographic hash.

## Deliberately blocked

No live provider, Stripe Identity adapter, webhook endpoint, signing credential, legal overlay, delivery action, or production promotion is active. The legacy public signing POST returns `SIG_PROMOTION_INACTIVE`; `SIGNATURE_MODE` can no longer activate live behavior.

## Required before activation

Counsel-approved jurisdiction/transaction overlays, provider and tenant certification, verified identity integration, authority sources, privacy/retention decision, append-only persistence service, authenticated mutation APIs with CSRF/idempotency/optimistic concurrency, signed webhook verification, operator review surface, accessibility review, load/restore/reconciliation exercises, and a reviewed promotion record.
