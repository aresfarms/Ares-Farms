# TECH-LENDER-DELIVERY-001

The lender-delivery boundary is an atomic authorization record plus transactional outbox. Authorization hashes the case, immutable package, exact consent, recipient verification, adapter, environment, expiry, and all thirteen gate results. Only explicit PASS values authorize.

The `sandbox-v1` adapter is deterministic and makes no network call. It returns a stable provider reference from the idempotency key and can simulate acceptance, delivery, acknowledgement, transient failure, or unknown outcome. Production always fails the promotion gate.

Database migration `0045_lender_submission_governance.sql` creates the canonical records and append-only evidence controls. API inputs never accept a raw dispatch destination.
