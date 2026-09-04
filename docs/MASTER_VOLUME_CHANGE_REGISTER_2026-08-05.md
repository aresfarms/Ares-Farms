# Master Volume Change Register — week of 2026-08-04

**Purpose.** The Master Volume PDFs are founder-authored; the build agent never
edits them. This register catalogs every governed capability added this week so
the founders can fold the amendments into the controlling volumes. Each entry
names the controlling volume(s), what changed, and where the implementation
lives. Until the PDFs are amended, THIS file plus the referenced code comments
are the traceability record.

---

## 1. Focused commercial-financing portal (residential hidden, not deleted)

- **Controlling volumes:** Vol I (facilitation, never determination), Vol II
  (no steering — all legitimate pathways presented).
- **Change:** The portal now presents two lanes (farm, commercial) screened
  against USDA B&I / RD / FSA and SBA 504 / 7(a) programs. Residential is
  hidden from hero, Compass rose, explore lanes, dropdown, and objective chips
  — parked, not removed; code paths remain gated for a future spin-off.
- **Where:** `publicCopyRegistry.ts`, `CompassRose.tsx`, `explore/page.tsx`,
  `ExploreDropdown.tsx`, `InteractiveCompassRose.tsx`.

## 2. Property-first program-fit engine + lender-test scorecard

- **Controlling volumes:** Vol I §facilitation (fit ≠ approval), Vol II
  (Section 1071 firewall; no credit determination), Vol V (explainability —
  every exclusion prints its reason).
- **Change:** Per-property eligibility gates (live USDA rural eligibility
  layer query, FSA loan limits, standalone DSCR at per-program reference
  terms) rank programs by mathematical fit on the property's own paper.
  Scorecard renders PASS / **FAIL** / UNKNOWN on property-side checks only;
  approval language is never used — that is the licensed lender's call.
- **Where:** `financingProgramFit.ts`, `usdaRuralLive.ts`,
  `commercialUseModel.ts`, `FinanceAnalysisPanel.tsx`, pro-forma PDF route.
- **FSA hand-off:** deals fitting FSA best are recorded, NOT routed to the
  network lender; the report prints a bold FSA-office hand-off block.

## 3. Sovereign borrower document vault (upload path)

- **Controlling volumes:** Vol II (regulated document custody; email is no
  longer a compliant channel for borrower financials/PII), Vol III
  (deterministic, replay-safe), Vol V (classification CONFIDENTIAL, consent).
- **Change:** Signed 72-hour submission-only upload links (stateless HMAC over
  `REPORT_SIGNING_SECRET`, domain-separated); browser streams bytes directly
  to an IAM-private GCS bucket via resumable session — raw bytes never enter
  the API runtime; metadata custody in `applicationDocuments` +
  `documentStorageHandoffs`. Dev degrades honestly
  (`PENDING_SECURE_STORAGE`), never fake success.
- **Where:** `uploadLinkToken.ts`, `gcsResumableUpload.ts`,
  `api/public/secure-upload/route.ts`, `(public)/secure-upload/page.tsx`,
  `infra/staging/document_storage.tf`.

## 4. SCIF-grade vault hardening (founder ruling: baseline, not upgrade)

- **Controlling volumes:** Vol III (TECH-VAULT-001), Vol IV (incident +
  recovery runbooks), Vol V (evidence preservation).
- **Change (all LIVE on staging):**
  - CMEK: bucket encrypts under Cloud KMS key `furlong-vault/borrower-documents`
    (90-day rotation, `prevent_destroy` — crypto-shred is a founder ceremony).
  - GCS DATA_READ/DATA_WRITE audit logs project-wide.
  - Rate limiting 60/min/IP on the public upload API.
  - VPC Service Controls **dry-run** perimeter `furlong_vault_perimeter`
    around Storage + KMS. Enforcement is a later founder decision made on
    dry-run violation evidence.
- **Compartmentalization doctrine:** the environmental vault (when built)
  gets its OWN bucket + service account + KMS key. CUI is NOT accepted
  through the portal; handled in person per the founder's SCIF practice.

## 5. Lender Deal Desk (read path + response loop) — NEW 2026-08-05

- **Controlling volumes:** Vol I (accountable authority — role-gated,
  session-verified), Vol II (single-file audited reads; minimum-disclosure
  customer communication), Vol III/III-B (durable desk state; canonical
  status vocabulary), Vol IV (reminder cadence + closing-timeline runbooks),
  Vol V (observability event on every material action, incl. every download).
- **Change:**
  - `/lender-desk` console (session-gated page) + `/api/lender/deal-desk`
    (roles: lender/operator/admin/governance; session identity from the
    security proxy wins over any client claim).
  - **Document access:** single-file streaming through the runtime — never a
    shareable signed URL, no bulk export; every read emits a durable
    governance-evidence record. This shape is deliberate: per-deal envelope
    encryption slots into the same seam later without redesign.
  - **Deal lifecycle:** canonical `FINANCING_DEAL_STATUSES` including failure
    states (declined / withdrawn / closed-not-completed) — completed AND
    failed deals are both first-class records.
  - **Customer note + closing timeline:** lender-authored, stored in
    `serviceRequests.metadata.dealDesk`; the customer's `/status` page shows
    the plain-language status label, the note, docs-due / underwriting /
    closing-target dates, and the backlog explanation. Timeline copy states
    dates are working estimates, never a promise of outcome.
  - **Automatic document reminders:** deals in `DOCUMENTS_REQUESTED` get
    emailed a fresh 72-hour secure upload link — at most one per 3 days,
    capped at 3 (lender can force). Sweep runs when the desk opens plus a
    manual per-deal button. Emails follow minimum-disclosure doctrine:
    reference + links only, never financial content.
  - **Scheduling:** `LENDER_BOOKING_URL` (Terraform var → env) surfaces the
    lender's booking page on intake success, the customer status page, and
    every reminder email — calls land on the calendar, not the cell phone.
- **Where:** `src/lib/lender/dealDeskStore.ts`,
  `src/app/api/lender/deal-desk/route.ts`, `src/app/lender-desk/page.tsx`,
  `serviceRequestStore.ts` (status view), `(public)/status/page.tsx`,
  `FinancingIntakePanel.tsx`, `infra/staging/variables.tf` + `service.tf`.

## 6. Notification target + email infrastructure

- **Change:** Lender notifications route to `finance@compasstocapital.com`
  (the temporarily retained external-broker workspace address on its isolated domain). Sending remains OFF until
  `EMAIL_FROM` + `SENDGRID_API_KEY` are configured; every send path reports
  honestly when unconfigured. Key rotation remains a go-live gate.

---

*Prepared by the build agent for founder review. Amend the PDFs at your pace;
each entry above carries enough context to write the amendment language.*
