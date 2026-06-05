# Alpha Disaster Recovery Runbook

**Status: COMPLETE.** Recovery procedures for the closed Public Alpha. Written
for the operator (an environmental engineer, not a software engineer). A
"disaster" is any event that threatens the integrity or availability of Alpha
state: data loss/corruption, a broken audit chain, loss of the deployment, or
loss of a credential/key.

**Scope:** Public Alpha only. Recovery never authorizes live external action; the
recovered system comes back in the same advisory-only, `DRY_RUN=true`,
live-fetch-0 posture.

**Doctrine references**
- Master Volume IV — Operational Runbooks (recovery runbook).
- Master Volume III / III-B — Technical Infrastructure & Governance Runtime (replay).
- `docs/MODULE_18_EXCEPTION_REMEDIATION_RECOVERY.md` — exception remediation & recovery.
- `docs/MODULE_34_PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE.md` — incident response.
- `docs/MODULE_42_BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE.md` — build-preservation archive.
- `docs/MODULE_09_AUDIT_REPLAY_CONSOLE.md` + `docs/ledger-system-spec.md` — replay & ledger.
- `docs/governance/ALPHA_DEPLOYMENT_RUNBOOK.md` — re-deploy after recovery.

---

## 1. Backup inventory

| Asset | Where it lives | Backup mechanism | Recovery owner |
|---|---|---|---|
| Source code (source of truth) | GitHub `main` | Distributed git history; every merge is a checkpoint | Operator |
| Database | Postgres (`DATABASE_URL`) | Host provider automated backups + point-in-time recovery (PITR) | Operator + Chief Governance Authority |
| Build-record archive | `docs/build-records/<date>/` in git + Module 42 build-preservation archive | Checksummed, committed; `npm run build-record:archive` exports the pack | Operator |
| Audit / ledger state | DB ledger tables (`LEDGER_MODE=OPTION_C`) + replay references | Captured in DB backup; reconstructable via replay | Chief Governance Authority |
| Secrets (DB creds, `NEXTAUTH_SECRET`, allowlist) | Host secret manager | Provider-managed; founder-held recovery copy (see Key custody) | Founders |
| Recovery Key | Offline, founder-held (`Recovery Key.pdf` is **git-ignored**, never committed) | Physical/offline custody, 2-of-3 founders | Founders |
| Deployment artifacts | Vercel immutable builds | Each deploy is retained for instant rollback | Operator |

**Verify backups exist before you need them:** confirm the DB provider PITR
window covers at least the Alpha cohort period, and that the latest build-record
archive corresponds to the deployed commit.

---

## 2. Recovery sequence

Execute in order. Record each step's result for the evidence package. Do not
skip the replay-verification step (Section 3) — a restored system is not trusted
until replay verifies.

1. **Declare the disaster** and notify founders (Section 6). Classify severity
   via the escalation matrix (Section 7).
2. **Take Alpha offline** if integrity is in doubt — follow the Emergency
   Shutdown procedure in the Alpha Deployment Runbook (disable deployment /
   empty the allowlist). Recovery happens with the cohort offline.
3. **Restore source:** confirm `main` is intact on GitHub. If local clone is
   lost, re-clone. Identify the last-known-good commit (the Alpha-entry commit
   in the evidence package, or the last green-CI commit).
4. **Restore data:** restore the database from the host provider backup / PITR to
   the point immediately before the corruption. Never restore over a live cohort
   DB; restore to a clean instance, verify, then cut over.
5. **Restore secrets/keys** if lost (Section 4 key custody) into the host secret
   manager. Confirm `DRY_RUN=true` and the allowlist are correct before any
   restart.
6. **Recover the build-record archive** if needed (Section: archive recovery).
7. **Run replay verification** (Section 3). Do not proceed if it fails.
8. **Rebuild + re-deploy** per the Alpha Deployment Runbook (Section 2),
   including the full Step 8 gate suite and the live surface smoke.
9. **Re-open** only after founders authorize (≥2 acknowledgements for a Sev-1/2).
10. **Archive the recovery evidence** (`npm run build-record:archive`) and close
    the incident under Module 18.

---

## 3. Replay verification procedure

A recovered system is trusted only when its decision/audit lineage reconstructs
deterministically.

1. Run `npm run verify:replay` (replay conformance) — must exit 0.
2. Confirm the append-only audit hash chain verifies end-to-end (the
   build-self-report `audit_chain_intact` signal must be PASS;
   `npm run build:self-report` surfaces it). A broken chain is itself a Sev-1.
3. Spot-check that representative governed actions reconstruct from their replay
   references (Module 09 Audit Replay Console + `docs/ledger-system-spec.md`).
4. Confirm `LEDGER_MODE=OPTION_C` and that no replay reference is dangling.
5. If replay fails: do **not** re-open. Escalate to Sev-1, restore to an earlier
   verified point, and repeat from Section 2 step 4.

---

## 4. Build-preservation archive recovery procedure

The build-record archive (Module 42) is the evidence backbone — it checksums each
build record so tampering or loss is detectable.

1. Confirm the archive in `docs/build-records/` matches git history (the records
   are committed and immutable once checkpointed).
2. If a build record is missing/corrupt, regenerate it deterministically from the
   corresponding commit: check out the commit and re-run the generating gate
   (`build:self-report`, `verify:disclosures`, etc.). Same commit → identical
   record (the runtimes are deterministic).
3. Re-export the pack with `npm run build-record:archive` and confirm checksums
   match the Module 42 expectations.
4. If the archive and git history disagree, treat as a potential tamper event →
   Sev-1, notify founders, and reconstruct from the last verified checkpoint.

---

## 5. Key custody procedure

- **Recovery Key** is held **offline** by the founders and is **never** committed
  (`Recovery Key.pdf` is in `.gitignore`; `verify:no-personal-docs` fails closed
  if any personal/identity/credential document enters the tree).
- **Application secrets** (`DATABASE_URL` credentials, `NEXTAUTH_SECRET`, the
  shared credential secret, the email allowlist) live only in the host secret
  manager, with a founder-held recovery copy kept offline.
- **2-of-3 founder rule:** restoring or rotating a key requires participation of
  at least two of the three founders (Caitlin Hudson, Stuart Fraass, Frances
  Fraass). No single person can unilaterally recover or rotate the Recovery Key.
- **Rotation after exposure:** if any secret may have been exposed, rotate it
  (new `NEXTAUTH_SECRET`, new DB credentials), update the secret manager, and
  redeploy. Record the rotation in the incident.
- A lost Recovery Key with surviving founder custody copies is recoverable; total
  loss of all copies is a governance event escalated to all three founders.

---

## 6. Founder notification procedure

Notify **all three** founders (Caitlin Hudson — Chief Governance Authority;
Stuart Fraass — Qualified Governance Reviewer; Frances Fraass — Founder) on any
disaster declaration, recovery activation, replay-verification failure, key
exposure/rotation, or re-open. Each notification records: timestamp, severity,
affected asset, the operator, the action taken, and the current state. Sev-1 and
Sev-2 require acknowledgement from at least two founders before re-open.

---

## 7. Disaster escalation matrix

| Sev | Condition | Immediate action | Founder involvement |
|---|---|---|---|
| **Sev-1** | Data corruption, broken audit/replay chain, secret/key exposure, or suspected tamper of the build archive | Emergency shutdown; full recovery sequence; **no re-open until replay verifies** | Notify all 3; ≥2 must acknowledge re-open |
| **Sev-2** | Deployment lost or seriously degraded; rollback insufficient; DB available but suspect | Take offline; restore from backup; replay-verify before re-open | Notify all 3; ≥2 acknowledge re-open |
| **Sev-3** | Single-surface defect or content/disclosure gap; data intact | Roll back deployment per Deployment Runbook §3; fix + CI-green + redeploy | Notify all 3; operator may re-open after smoke |
| **Sev-4** | Transient/availability blip, self-recovered, no integrity impact | Monitor; record | Informational note to founders |

All severities are advisory-only events; recovery never relaxes the Alpha
operational boundaries (no live action, live fetch = 0, human in the loop).
