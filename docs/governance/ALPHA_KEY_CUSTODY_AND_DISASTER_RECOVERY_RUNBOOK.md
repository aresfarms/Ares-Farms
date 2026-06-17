# Alpha Key Custody & Disaster Recovery Runbook

**Status (Alpha entry):**
- **Key custody / recovery entry slice = COMPLETE for Alpha entry.**
- **Full disaster-recovery consolidation = ACCEPTED_WITH_CONDITION for Alpha exit.**

This runbook closes the highest-risk recovery slice before any borrower enters
the closed Alpha: how the Recovery Key and recovery materials are held, who may
touch them, where they may **never** be stored, and how recovery is verified.
The broader disaster-recovery consolidation (full failover playbooks, RTO/RPO
targets) is carried as a condition to complete before Alpha exit — it is not
entry-critical because Alpha is a closed cohort with `DRY_RUN=true`.

**Mark:** Internally Verified — Independent Verification Pending
(VIA-AUDIT-001 / **VIA-AUDIT-EXCEPTION-001**: the builder performs internal
verification during Alpha; independent verification is pending).

Written for the operator (an environmental engineer, not a software engineer).

**Doctrine references**
- **VIA-AUDIT-EXCEPTION-001** — internal verification during Alpha, labeled
  "Internally Verified — Independent Verification Pending."
- `verify:no-personal-docs` — Personal Document Git Guard (`docs/DOCTRINE_VERIFY_NO_PERSONAL_DOCS_V1.md`); fails closed if any personal/identity/credential document enters the tree.
- `docs/MODULE_18_EXCEPTION_REMEDIATION_RECOVERY.md` — exception remediation & recovery.
- `docs/MODULE_42_BUILD_PRESERVATION_EVIDENCE_ARCHIVE_GATE.md` — build-preservation archive.
- `docs/MODULE_09_AUDIT_REPLAY_CONSOLE.md` + `docs/ledger-system-spec.md` — replay & ledger.
- `docs/MODULE_34_PRODUCTION_INCIDENT_RESPONSE_READINESS_GATE.md` — incident response.

Founders of record: **Caitlin Hudson** (Chief Governance Authority),
**Stuart Fraass** (Qualified Governance Reviewer), **Frances Fraass** (Founder).

---

## 1. Recovery Key custody rule

- The **Recovery Key** is held **offline** by the founders. It is the
  last-resort credential for restoring access to recovery materials (secret
  manager recovery copy, database restore credentials, key rotation).
- Custody is **founder-held, 2-of-3**: no single person can use the Recovery Key
  alone. Use requires participation of at least two of the three founders.
- The Recovery Key (`Recovery Key.pdf`) is **git-ignored by design** and is
  **never** committed. `verify:no-personal-docs` is the canonical guard and
  fails closed if it ever enters the tree.

## 2. Recovery material access rules

- "Recovery materials" = the Recovery Key, the secret-manager recovery copy,
  database restore credentials, and `NEXTAUTH_SECRET` / DB credential recovery
  copies.
- **Who may access:** only the founders, and only under the 2-of-3 rule for the
  Recovery Key. The operator may execute a restore **only** with founder
  authorization and never holds the Recovery Key unilaterally.
- Access is **logged** every time (Section 7). Access without a logged
  authorization is itself an incident.

## 3. Prohibited storage locations

Recovery materials and any secret may **never** be stored in:
- **git / source control** (tracked or untracked-but-committed) — guarded by
  `.gitignore` + `verify:no-personal-docs`;
- **public PRs, issues, or commit messages**;
- **public chat** or any unencrypted messaging;
- **unsecured local folders**, shared drives, or screenshots.

Secrets of record live only in the **host secret manager**; the founder recovery
copy is held **offline**. `.env.production.example` carries placeholders only.

## 4. Emergency access procedure

1. Declare the emergency and notify founders (Section 5). State what is needed and
   why.
2. Obtain **2-of-3 founder authorization** for Recovery Key use (Section 6).
3. Retrieve only the specific material required; do not broaden scope.
4. Execute the restore with the cohort **offline** (Emergency Shutdown in the
   Deployment & Rollback Runbook).
5. **Rotate** any secret that was exposed or used out of band (new
   `NEXTAUTH_SECRET`, new DB credentials), update the secret manager, redeploy.
6. Log the access and actions (Section 7); run replay verification (Section 8)
   before re-open.

## 5. Founder notification procedure

Notify **all three** founders on any recovery-material access, Recovery Key use,
key exposure/rotation, disaster declaration, or recovery re-open. Each
notification records: timestamp, severity, material accessed, the operator, the
authorizing founders, the action taken, and the current state. Re-open after a
Sev-1/Sev-2 requires acknowledgement from at least two founders.

## 6. Dual-control / compensating-control procedure

- **Primary control:** 2-of-3 founder dual control for the Recovery Key.
- If two founders are unreachable in a true emergency, the **compensating
  control** is: the single available founder + the operator may take the system
  **offline** (Emergency Shutdown) but may **not** use the Recovery Key or
  perform an irreversible restore; the action is limited to containment until a
  second founder is reached. Containment-only never requires the Recovery Key.
- Every compensating-control use is logged and reviewed by all three founders
  after the fact.

## 7. Incident logging requirement

Every recovery event is logged with: timestamp, severity, trigger, materials
touched, authorizing founders, operator, actions, rotation performed,
replay-verification result, and final state. The log is retained as evidence and
checkpointed into the build-preservation archive (Section 9). A recovery without
a complete log is treated as an open incident under Module 18.

## 8. Replay verification after recovery

A restored system is **not trusted** until its lineage reconstructs:
1. `npm run verify:replay` — must exit 0.
2. Audit hash chain verifies end-to-end (`build:self-report` `audit_chain_intact`
   = PASS).
3. Spot-check that representative governed actions reconstruct from their replay
   references (Module 09 + `ledger-system-spec.md`); no dangling replay ref.
4. If replay fails: do **not** re-open; restore to an earlier verified point and
   repeat.

## 9. Build-preservation archive restoration procedure

1. Confirm `docs/build-records/` matches git history (records are committed,
   checksummed, immutable once checkpointed — Module 42).
2. If a record is missing/corrupt, regenerate deterministically: check out the
   commit and re-run the generating gate (`build:self-report`,
   `verify:disclosures`, …). Same commit → identical record.
3. Re-export with `npm run build-record:archive`; confirm checksums match Module
   42 expectations.
4. Archive vs git-history disagreement → treat as potential tamper (Sev-1), notify
   founders, reconstruct from the last verified checkpoint.

## 10. User / borrower data protection rule

- Alpha is the first time real borrower PII enters the system. Recovery **never**
  exposes PII: restores run on isolated instances, access is least-privilege and
  logged, and no PII is copied into git, a PR, chat, or an unsecured location
  (Section 3).
- Recovered systems return in the same advisory-only, `DRY_RUN=true`, live-fetch-0
  posture — recovery never authorizes a live external action on borrower data.
- A suspected PII exposure is **Sev-1**: emergency shutdown, founder notification,
  rotation of any exposed secret, and replay verification before any re-open.

## 11. Independent-verification-pending caveat

This runbook and any recovery executed under it during Alpha are **Internally
Verified — Independent Verification Pending** per VIA-AUDIT-EXCEPTION-001. The
builder may perform internal recovery verification during Alpha; an independent
verifier review is a recorded condition to satisfy before Alpha exit.

## 12. Carried condition (Alpha exit)

`ACCEPTED_WITH_CONDITION`: the full disaster-recovery consolidation — formal
RTO/RPO targets, a complete failover playbook, and an independent verification of
this runbook — must be completed before Public Alpha **exit**. The key-custody /
recovery **entry** slice above is COMPLETE and sufficient for Alpha entry.
