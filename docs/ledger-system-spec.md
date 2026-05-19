# Ares Farms Ledger System Specification (v1 — LOCKED)

## 1. SYSTEM OVERVIEW

The Ares Farms ledger is an event-sourced, immutable audit system designed to guarantee:

- deterministic replay
- cryptographic integrity
- tamper resistance
- single-source-of-truth event storage

The system is explicitly designed under **Option C architecture**:

> canonical state is a derived projection only and never a write target

---

## 2. CORE ARCHITECTURE MODEL

### SOURCE OF TRUTH

audit_events is the only authoritative data store.

It is:

- append-only (enforced by database triggers)
- immutable after insertion
- the only system-of-record

---

### DERIVED LAYERS (READ ONLY)

#### Canonical Ledger Projection

- computed from `audit_events`
- deterministic transformation
- strictly read-only
- never written to directly
- always rebuildable

#### Replay Verification Layer

- reconstructs full event chain from `audit_events`
- validates:
  - event_hash integrity
  - prev_hash continuity
  - chronological ordering
  - deterministic replay correctness

---

## 3. MUTATION POLICY (HARD RULE)

### FORBIDDEN

- No updates to `audit_events` via application code
- No backfills via runtime API
- No mutation of canonical ledger tables
- No dual-write patterns
- No silent repair logic inside API routes

### ALLOWED

- INSERT ONLY into `audit_events`
- Offline migration scripts (manual execution only)
- Deterministic rebuild scripts (explicit CLI execution)
- Read-only projection queries

---

## 4. CANONICAL LEDGER RULE

The canonical ledger is NOT a source of truth.

It is:

- a computed projection
- fully derived from `audit_events`
- disposable at any time
- rebuilt deterministically
- never directly mutated

---

## 5. HASH INTEGRITY MODEL

### Event Hash Rule

Each event must define:

event_hash = SHA256(id | event_type | created_at | payload)

All fields must be present at write time.

---

### Chain Integrity Rule

Events must form a strict hash chain:

- prev_hash references prior event_hash
- ordering is strictly created_at ASC
- no gaps in chain allowed

---

## 6. OPERATIONAL RULES

### RULE 1 — TEST BEFORE PROCEED

No system change is valid unless:

- endpoint tested
- database verified
- failure mode confirmed
- explicit PASS recorded

---

### RULE 2 — FULL FILE REPLACEMENT ONLY

All code changes must follow:

- full file replacement only
- no patch edits
- no partial line changes as final state
- no incremental drift-based fixes

---

### RULE 3 — SINGLE SOURCE OF TRUTH

audit_events is the only source of truth.

Everything else is derived.

---

### RULE 4 — NO DRIFT POLICY

If inconsistency occurs:

- fix projection layer
- NEVER modify source event data
- NEVER rewrite history

---

## 7. CURRENT SYSTEM STATE (REFERENCE)

As of latest verification:

- audit_events: operational
- event_hash: partially backfilled
- replay verification: functional
- canonical pipeline: frozen (Option C)
- rebuild scripts: present but CLI-not-registered
- mutation triggers: active and enforced

---

## 8. ARCHITECTURAL GUARANTEE

This system guarantees:

- immutable event history
- deterministic replay
- verifiable integrity chain
- strict separation of write vs read layers
- no canonical mutation pathways
