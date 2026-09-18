# Volume VII implementation and threat matrix

| Threat or failure | Enforced control | Current posture |
|---|---|---|
| Source changed after review | SHA-256 binding at analysis and finalization | Enforced offline |
| Detached certificate mistaken for instrument | One-PDF finalizer; legacy POST blocked | Enforced |
| Signature placed over content | Certified authored zone or appended third-party page | Enforced offline |
| Existing signature invalidated | ByteRange, signature field, and DocMDP detection | Blocks |
| Active PDF content | Encryption, embed, JavaScript, launch, annotation checks | Blocks |
| Malware status unknown | Only `CLEAN` is accepted | Blocks |
| Consent conflated with intent | Separate versioned doctrine and gate facts | Enforced |
| Capacity/authority unproven | Independent authority gate | Blocks production |
| Provider timeout duplicated | Idempotent outbox/inbox schema and unknown state | Persistence/API pending |
| Provider spoofing | Certified provider/webhook requirement | No live provider configured |
| Unapproved legal scope | Counsel-overlay gate | Blocks production |
| Environment variable activates signing | Environment activation removed | Enforced |
| Delivery inferred from execution | Separate states and evidence tables | Enforced in model |
| Audit record altered | Append-only schema trigger and hash-ready event rows | Migration ready, not applied |
| Production activation without review | Promotion gate defaults false | Blocks production |

Residual work is explicit in `TECH-PDF-EXECUTION-001`; none of it is represented as complete or production-ready.
