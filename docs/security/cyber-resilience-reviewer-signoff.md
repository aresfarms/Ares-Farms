# Reviewer Sign-Off Checklist — Cyber-Resilience Production Blockers

**For:** the human reviewer (Caitlin / designated reviewer) · **Date:** 2026-06-11
**Branch under review:** `build-security-cyber-resilience` — UNMERGED, production blocked
**Model in force:** FIVE blockers; RECOVERY-CERT-001 is FOLDED into SEC-DR-001 as a mandatory
sub-gate (reviewer decision 2026-06-11 — not split into a sixth blocker this cycle).

---

## The rule that governs this whole checklist

`verify:cyber-resilience PASS` proves the **blocking machinery** works (the gates correctly hold
production at `production_ready=false` while things are unverified). It says **nothing** about
whether the underlying controls are real and effective. A blocker may only be flipped to
**verified** when you have observed the actual control do its job — "record present / flag true"
is **not** sufficient. (Standing lesson: gates check data-present, not control-effective.)

Do **not** merge or set any blocker to verified from the dashboard alone.

---

## Per-blocker verification (each must be eyes-on the real control)

**SEC-DR-001 — DR framework + recovery certification (aggregate)**
- [ ] Walk all 8 recovery states; confirm the 5 scenarios drive the expected transitions.
- [ ] Prove `RETURN_TO_SERVICE` is unreachable except through `REVALIDATION` (attempt a direct/
      illegal transition; confirm the guard denies it).
- [ ] *Recovery-cert sub-gate:* run a real or full dry-run rebuild that actually meets the stated
      **RPO/RTO** (reproduce the metric, don't accept the record).
- [ ] Confirm the certification is present, **unexpired**, **simulation-backed**, and that letting
      it expire re-opens SEC-DR-001 (and therefore blocks production).

**SEC-BACKUP-001 — immutable backup**
- [ ] Confirm backups are **truly immutable at the provider** (object-lock / WORM / retention lock
      actually enabled) — not merely `immutableBackupVerified=true` in a record.
- [ ] **Restore an actual backup** end-to-end and confirm integrity. Attempt a delete/overwrite
      within the lock window and confirm it is denied.

**SEC-DNS-001 — DNS / registrar governance**
- [ ] Registrar **2FA confirmed ON**; registrar-lock / transfer-lock enabled.
- [ ] Demonstrate the cutover gate is **never looser** than the existing domain-governance gate
      (passing `verify:domain-governance` is necessary, not sufficient — confirm the extension
      only tightens).
- [ ] SPF/DKIM/DMARC present (ties to founder-spoofing / social-engineering defense).

**SEC-SECRET-001 — secrets & service accounts**
- [ ] Confirm a secret/service-account was **actually rotated** (observe the rotation, not just an
      inventory entry).
- [ ] Confirm the **Secret Risk Dashboard** reflects **live** state and flags overdue items
      correctly (introduce a stale secret, confirm it surfaces).

**SEC-FORENSICS-001 — forensic preservation**
- [ ] Run the **tamper test by hand**: seal evidence, alter it, confirm the seal detects it.
- [ ] Confirm `case_id` + `evidence_hash` + `chain_of_custody` write to TECH-LEDGER and replay.
- [ ] If forensic evidence could ever be used in a legal/regulatory proceeding, review the
      chain-of-custody contract against real evidentiary standards (consider counsel).

---

## Runtime guard spot-checks (independent of the blockers)

- [ ] **SECURITY_LOCKDOWN** can be triggered; while active it **denies** deploy / promote /
      connector / sync / admin and **allows only** audit / forensic / recovery. Attempt a denied
      action and confirm it is blocked.
- [ ] Confirm lockdown can be **exited safely** only through the proper revalidation path.
- [ ] **CLOUD-RECOVERY manifest** rebuild order covers all five loss types (account / DB /
      secrets / DNS / CI-CD) with dependency checks honored.

---

## Merge gate

- [ ] All five blockers verified against real-world controls (not records), including the
      recovery-cert sub-gate inside SEC-DR-001.
- [ ] `CYBER_RESILIENCE_HUMAN_REVIEW_COMPLETE` recorded with reviewer + date.
- [ ] `verify:cyber-resilience`, `verify:security-conformance`, `verify:security-governance`,
      `verify:domain-governance` all PASS; `tsc --noEmit` clean; `npm run build` exit 0.
- [ ] Existing FortKnox + domain governance confirmed intact (not weakened).
- [ ] Only then: merge off `build-security-cyber-resilience`. Until every box is checked, the
      branch stays unmerged and production stays blocked.
