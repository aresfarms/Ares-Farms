# SEC-FORENSICS-001 — Owner Cloud Logging Sink Handoff

- **Owner:** Caitlin (GCP) · **Date:** 2026-06-14 · **Doctrine:** FORENSICS-001
- **Companion:** `docs/deployment/SEC_FORENSICS_001_EVIDENCE.md` (Pass 01 wiring).
  Contract source of truth: `EXPORT_SINK_CONTRACT` in
  `src/security/forensicPreservation.ts`. Traceability: Vol III (Technical
  Infrastructure → forensics), Vol II (Regulatory Governance → evidence/audit),
  Vol IV (operational runbooks → these owner steps).

> **Documentation only.** No GCP provisioning, no sinks created, no blocker
> closed by this file. **SEC-FORENSICS-001 stays OPEN.** This is the owner's
> concrete GCP to-do so the remaining three evidence classes can be wired by a
> later verified Pass 02.

## 1. Current state

- `main @ af0ac69` contains **SEC-FORENSICS-001 Pass 01**.
- `forensicReadinessVerified()` = **false**.
- **3 / 6** evidence classes wired.

| Class | State | Source |
|---|---|---|
| audit-logs | ✅ wired | in-code (hash-chained audit ledger, TECH-LEDGER-001) |
| security-events | ✅ wired | in-code (`recordSecurityEvent`, hash-chained) |
| configuration-snapshots | ✅ wired (Pass 01) | in-code deterministic sealed capture + verifier |
| runtime-logs | ☐ **owner-pending** | Cloud Logging sink (this doc) |
| api-logs | ☐ **owner-pending** | Cloud Logging sink (this doc) |
| deployment-events | ☐ **owner-pending** | Cloud Audit Logs sink (this doc) |

## 2. Required owner-provisioned sinks

All destinations must be **immutable / retention-locked** with **≥400-day**
retention. Sink names + filters must match the in-code contract exactly so Pass 02
can assert them.

### runtime-logs
- **Sink name:** `furlong-forensics-runtime-logs`
- **Filter:** `resource.type="cloud_run_revision" AND severity>=DEFAULT`
- **Destination:** locked logging bucket (or other immutable destination)
- **Retention:** ≥ 400 days
- **Owner evidence required:** screenshot/export of the sink, bucket retention
  policy, and the IAM writer binding (sink writer identity → destination).

### api-logs
- **Sink name:** `furlong-forensics-api-logs`
- **Filter:** `resource.type="cloud_run_revision" AND jsonPayload.channel="api-perimeter"`
- **Destination:** GCS bucket with object retention/lock (or locked logging bucket)
- **Retention:** ≥ 400 days
- **Owner evidence required:** screenshot/export of the sink, the destination, the
  IAM binding, and the retention/lock policy.

### deployment-events
- **Sink name:** `furlong-forensics-deployment-events`
- **Filter:** `logName:"cloudaudit.googleapis.com" AND protoPayload.serviceName="run.googleapis.com"`
- **Destination:** GCS bucket with object retention/lock (or locked logging bucket)
- **Retention:** ≥ 400 days
- **Owner evidence required:** screenshot/export of the sink, audit-log coverage,
  the destination, the IAM binding, and the retention/lock policy.

## 3. Evidence checklist (per sink)

For **each** of the three sinks above:

- [ ] sink exists
- [ ] filter matches the contract exactly
- [ ] destination is immutable or retention-locked
- [ ] sink writer identity has the correct destination permission
- [ ] retention ≥ 400 days
- [ ] a test event was observed flowing to the destination
- [ ] export verified (records readable from the destination)
- [ ] evidence file stored **owner-side** (not committed to the repo)
- [ ] **no secrets** in any evidence file (names/settings/screenshots only)

## 4. What a later Pass 02 must verify (build agent)

- read the owner-provided sink evidence (owner-held; referenced by name)
- assert all **3** sinks exist
- assert each filter matches the expected contract (`EXPORT_SINK_CONTRACT`)
- assert retention/immutability evidence exists per sink
- flip the remaining classes (`runtime-logs`, `api-logs`, `deployment-events`) to
  `wired: true` **only after** that verification
- confirm `forensicReadinessVerified()` **may become true only if all six classes
  are wired AND the closure criteria are satisfied**
- **SEC-FORENSICS-001 remains OPEN** until owner / human review records sign-off —
  Pass 02 wiring alone does not close it.

## 5. Hard rules

- No secrets in the repo (evidence files are owner-held).
- No GCP access from the build agent.
- No production activation.
- No blocker closure.
- No DNS change.
- No financing activation (`FINANCING_NODE_LIVE=false`).

## 6. Posture

`forensicReadinessVerified()=false`; 3/6 wired; SEC-FORENSICS-001 **OPEN**; 10
blockers OPEN; `combinedProductionReady=false`. This handoff changes no code and
closes nothing.
