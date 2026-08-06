# Master Volume Change Register — 2026-08-06

**Purpose.** The Master Volume PDFs are founder-authored; the build agent never
edits them. This register catalogs the governed capabilities added on 2026-08-06
(continuing `MASTER_VOLUME_CHANGE_REGISTER_2026-08-05.md`) so the founders can
fold the amendments into the controlling volumes. Each entry names the
controlling volume(s), what changed, and where the implementation lives.

---

## 1. Lender outbound document loop (broker → customer)

- **Controlling volumes:** Vol II (regulated document custody; controlled
  disclosure), Vol V (observability + evidence on every governed read).
- **Change:** The licensed broker sends documents (approval letters, term
  sheets, disclosures) to the customer THROUGH the vault — never as email
  attachments. Records are tagged `lender-provided`; the customer's status
  lookup (reference + matching email) mints 2-hour, single-document signed
  download tokens. Notification emails carry a reference and a link only.
- **Where:** `deal-desk/route.ts` (upload-begin / upload-confirm),
  `customerDownloadToken.ts`, `api/public/document-download/route.ts`,
  `(public)/status/page.tsx`.

## 2. Signature vault — portal-native electronic signing (TEST MODE)

- **Controlling volumes:** Vol I (accountable authority — the borrower signs,
  the platform records), Vol II (regulated-document boundaries + consent),
  Vol III (deterministic verification), Vol V (evidence, classification).
- **Change:** ESIGN/UETA signing ceremony on the portal's OWN documents:
  versioned consent + intent language, typed legal name, SHA-256 fingerprint
  of the exact vault bytes, signature certificate PDF minted into the vault,
  durable signature event, both parties notified. Scope guard: only
  broker-provided documents on the token's own deal; closing instruments
  (notes, mortgages, deeds — notarization / county recording) are permanently
  out of scope.
- **Gate:** `SIGNATURE_MODE=test` until (a) counsel reviews the consent
  language, (b) the broker confirms lender acceptance of portal certificates,
  and (c) a signer-IDENTITY step beyond email possession exists (SMS OTP
  minimum; Stripe Identity KYC preferred). Test mode stamps every page,
  email, and certificate.
- **Where:** `signatureVault.ts`, `signingToken.ts`,
  `api/public/document-sign/route.ts`, `(public)/sign/page.tsx`.

## 3. Vault malware quarantine (scan before either side can see it)

- **Controlling volumes:** Vol II (regulated custody), Vol IV (incident /
  quarantine runbooks), Vol V (observability + durable evidence).
- **Change:** Every vault document is scanned by a private, IAM-gated ClamAV
  service inside the project (internal-only ingress; invocable solely by the
  runtime service account; stores nothing). Verdict lifecycle: pending →
  clean | infected | unavailable. INFECTED documents are quarantined — bytes
  are refused at the broker desk, the customer download, and the signing
  ceremony (HTTP 423), with a broker alert and durable evidence.
  Runtime-authored signature certificates are trusted-clean by construction.
- **Gate:** `QUARANTINE_MODE=off` records verdicts and blocks confirmed
  infections; `enforce` additionally fails closed on anything not yet proven
  clean. Enforce after staging verification.
- **Where:** `scanner/` (Dockerfile + server.py), `malwareScan.ts`,
  `infra/staging/scanner.tf`, enforcement in both download routes and the
  sign route.

## 4. Workspace-native portal email (paid vendor removed)

- **Controlling volumes:** Vol II (minimum-disclosure customer
  communication), Vol III-B (credentials from the secret environment only).
- **Change:** Portal email now sends through the founders' own Google
  Workspace via the Gmail API using KEYLESS domain-wide delegation (the
  runtime service account signs a JWT as itself through IAM Credentials — no
  downloaded key files). Mail originates from the licensed broker's own
  mailbox, domain-aligned for SPF/DKIM. The prior paid provider remains only
  as a legacy fallback.
- **Where:** `emailProvider.ts`, `lenderSignature.ts`, `service.tf`
  (`GMAIL_DELEGATED_USER`), `iam.tf` (self tokenCreator grant).

## 5. Broker-accurate representation (compliance correction)

- **Controlling volumes:** Vol I (CONST-PATHWAY-001 — the platform
  facilitates; the licensed party performs), Vol II (CONST-FAIR-001/002 — no
  misrepresentation of authority).
- **Change:** Customer-facing copy previously described the network
  professional as a "licensed lender." He is a **commercial debt broker**, and
  no license record exists (NMLS/NY DFS searched; New York does not license
  commercial-purpose brokering). All customer surfaces now say "broker" where
  the referent is the network professional, and reserve "lender" for the
  funding institution. The unverifiable word "licensed" was removed from
  broker references entirely; it remains only where true (the licensed PE;
  funding banks).
- **Open item for founders:** if the broker produces an actual license or
  registration number, the word returns WITH the citation.
- **Where:** intake panel + consent language, `secure-upload/page.tsx`,
  `status/page.tsx`, `serviceRequestStore.ts` status labels,
  `FinancingLaneSections.tsx`, both lender emails, `operatorRegistry.ts`.

## 6. Customer-facing operational surfaces

- **Controlling volumes:** Vol IV (operational runbooks), Vol II (customer
  communication).
- **Change:** Broker booking link (`LENDER_BOOKING_URL`) surfaced at intake
  success, on the status page, and in every broker email under ONE label —
  "Schedule a call with your broker." Broker desk gained a calendar agenda
  panel (`LENDER_CALENDAR_EMBED_SRC`). A single onboarding surface
  (`/broker-setup`) walks the network professional through desk sign-in,
  booking-page creation, title confirmation, signature review, and a test
  deal.
- **Where:** `broker-setup/page.tsx`, `lender-desk/page.tsx`, `service.tf`.

## 7. Property-type classification from the county record

- **Controlling volumes:** Vol V (source authority — a public record beats a
  guess), Vol I (no fabricated facts).
- **Change:** The county assessment record's land-use / building style was
  being fetched but never classified, so typed addresses always asked the
  customer to pick a property type. The classifier now reads that record, and
  the surface states its basis honestly — naming the county value it read, or
  saying plainly that no public record names the type yet.
- **Where:** `PropertyEvaluationWorkspace.tsx` (profile derivation),
  `propertyProfile.ts`, `jurisdictionParcelResolver.ts`.

## 8. Governed maintenance actions (recorded for audit continuity)

- **Audit ledger forensic rollover.** A local development audit ledger chain
  break was resolved through the governed rollover ceremony: the original file
  was archived byte-for-byte with a manifest and a new chain started. History
  was preserved, never repaired or rewritten
  (`data/audit-ledger.forensic-2026-08-06T15-06-35-747Z-*.ndjson`).
- **VPC Service Controls dry run reviewed.** Logged violations are the
  founder's own admin operations, the build service account, and the runtime
  service account's routine storage reads. **Enforcement would break the
  platform as configured** — access levels for those three identities are a
  prerequisite to any enforce decision. Perimeter remains dry-run.
- **Accessibility.** A single shared field-note color failed WCAG AA contrast
  on six public pages; corrected, and all audited pages are now clean.
- **Financing-node separability restored.** The static federal program
  catalog (names + public rule citations) was split into its own module so
  rendered surfaces cite programs without importing the deferred, gated
  financing node.
