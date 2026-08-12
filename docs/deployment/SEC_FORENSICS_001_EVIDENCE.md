# SEC-FORENSICS-001 — Forensic Evidence-Class Wiring Evidence

- **Owner:** Caitlin · **Doctrine:** FORENSICS-001 (`forensic-preservation-v0.2.0`)
- **Toward:** SEC-FORENSICS-001. **This doc closes nothing.**

> **Purpose.** Track which forensic evidence classes are *preservable* and what
> the owner must still provision. Pass 01 wires the in-code class
> (`configuration-snapshots`) and declares the **export-sink contract** for the
> Cloud-Logging-sourced classes. The build agent does not create Cloud Logging
> sinks, does not access GCP, and does not flip the blocker. **SEC-FORENSICS-001
> stays OPEN until every class is wired AND the owner provisions + a later pass
> verifies the sinks.**
>
> **Hard rule:** configuration snapshots record config **names + non-secret
> values only** — never secret values.

## Evidence-class status (3/6 wired)

| Evidence class | Wired | Source / owner action |
|---|---|---|
| audit-logs | ✅ | `data/audit-ledger.ndjson` (hash-chained, TECH-LEDGER-001) |
| security-events | ✅ | `recordSecurityEvent` (hash-chained) |
| **configuration-snapshots** | ✅ **(this pass)** | `captureConfigurationSnapshot()` — deterministic sealed snapshot + `verifyConfigurationSnapshot()` tamper check (in-code, no GCP) |
| runtime-logs | ☐ owner | Cloud Logging sink — see contract below |
| api-logs | ☐ owner | Cloud Logging sink — see contract below |
| deployment-events | ☐ owner | Cloud Audit Logs sink — see contract below |

`forensicReadinessVerified()` = **false** (3 classes still unwired) →
SEC-FORENSICS-001 **OPEN**.

## Export-sink contract (owner provisions in GCP — NOT done here)

Descriptors only — no project IDs, no values, no sinks created. From
`EXPORT_SINK_CONTRACT` in `src/security/forensicPreservation.ts`. Each
destination must be **immutable** with **≥400-day retention**.

| Class | Sink name | Log filter | Destination | Retention |
|---|---|---|---|---|
| runtime-logs | `furlong-forensics-runtime-logs` | `resource.type="cloud_run_revision" AND severity>=DEFAULT` | logging-bucket-locked | 400d |
| api-logs | `furlong-forensics-api-logs` | `resource.type="cloud_run_revision" AND jsonPayload.channel="api-perimeter"` | gcs-bucket-object-lock | 400d |
| deployment-events | `furlong-forensics-deployment-events` | `logName:"cloudaudit.googleapis.com" AND protoPayload.serviceName="run.googleapis.com"` | gcs-bucket-object-lock | 400d |

## Verification

```
npm run verify:forensic-tamper-test        # the seal detects tamper
npm run verify:forensic-evidence-wiring     # config-snapshot seal + 3/6 wired + sink contract + blocker still false
npm run verify:cyber-resilience             # SEC-FORENSICS-001 still OPEN
```

## Pass 02 — owner sink attestation (2026-06-14)

Owner reported: `logging-bucket-locked` exists in furlong-prod; the three sinks
`furlong-forensics-runtime-logs`, `furlong-forensics-api-logs`,
`furlong-forensics-deployment-events` are present, enabled, and routed to that
bucket.

**Determination: the three Cloud-Logging classes may NOT yet be marked `wired`.**
Two independent reasons:

1. **Attestation incomplete.** The report covers `sink_exists` +
   `destination_immutable_or_locked`. The §3 checklist also requires, per sink:
   `filter_matches_contract`, `retention_min_400d`, `writer_identity_bound`,
   `test_event_observed`, `export_verified`, and an owner-side evidence file —
   none of which are yet attested. The build agent has no GCP access and cannot
   self-observe these. → `sinkAttestationComplete()` = false for all three.
2. **No auto-close.** The blocker gate was made stricter this pass:
   `forensicReadinessVerified()` now requires **all six classes wired AND**
   `FORENSIC_READINESS_HUMAN_REVIEW_COMPLETE`. So even a complete attestation
   cannot close SEC-FORENSICS-001 without recorded human review.

Recorded in code as `SINK_OWNER_ATTESTATIONS`; verified by
`npm run verify:forensic-pass02`. Classes stay `wired:false`; coverage remains
**3/6**.

## What still closes SEC-FORENSICS-001 (owner half)
- [ ] Provision the three Cloud Logging sinks above (immutable, ≥400d).
- [ ] Wire a runtime config-snapshot capture job (using `captureConfigurationSnapshot`) on deploy.
- [ ] A later pass verifies each sink exists + retained, then flips `wired:true` per class.
- [ ] Human review of the forensic readiness package.

## Posture
3/6 classes wired; `forensicReadinessVerified()=false`; SEC-FORENSICS-001
**OPEN**; 10 blockers OPEN; `combinedProductionReady=false`. No GCP access, no
sinks created, no secrets, no DNS change, no production activation, no blocker
closure.
