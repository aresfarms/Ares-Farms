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

---

# PART III — Standing doctrines for the Master Volumes (founder-affirmed 2026-08-06)

These are not feature notes. They are **standing positions** the founder
directed be carried into the controlling volumes, because they govern what the
platform will and will not do regardless of what is built next.

## D-1. AI is back-office leverage, never a front-office promise

- **Controlling volumes:** Vol I (facilitation, never determination), Vol II
  (CONST-FAIR-001/002 — no qualification or adverse-action language), Vol V
  (source authority — facts come from governed sources).
- **Permitted:** extracting structure from messy documents (appraisal
  comparables, statement line items), normalizing county land-use codes,
  drafting first-pass work product a licensed human then corrects and signs.
- **Forbidden, no exceptions:** any AI output that states or implies
  qualification, eligibility, approval, pricing, or a credit decision; any AI
  that GENERATES a property fact rather than summarizing one a governed source
  produced. *An AI that says "you qualify" is making a credit decision; an AI
  that hallucinates a flood zone is a liability.*
- **No chatbot.** Founder position, stated plainly: the platform will not ship
  a conversational assistant. This is a deliberate stance, not an omission.
- **Sole outward exception:** the possibilities / discovery walk-through, which
  may guide a person through exploring a purchase — bounded to phrasing
  questions and summarizing governed facts. Founder's testing verdict: "not
  clunky or intrusive, but not very useful" — approved to IMPROVE, on the
  condition it stays inside those bounds.

## D-2. The evidence trail is the product, not a byproduct

- **Controlling volumes:** Vol II (regulated custody), Vol III-B (replay),
  Vol V (evidence preservation).
- **Position:** audit ledgers, document fingerprints, scan verdicts, access
  records and signature certificates are not internal plumbing — they are the
  defensible asset. When a bank asks *"how do you know these documents weren't
  altered?"*, the answer is a hash chain, and that answer is the differentiator.
- **First expression:** the per-deal **Chain of Custody report** — issued to
  both the borrower and the funding institution, stating which documents
  entered the vault, when, from whom, their scan verdicts, their SHA-256
  fingerprints, every recorded access, and every signature. It asserts custody
  only: explicitly NOT authenticity, accuracy, qualification, or any credit
  conclusion.

## D-3. Provenance is the 3–5 year market position

- **Controlling volumes:** Vol II (Section 1071 firewall + regulated data),
  Vol V (classification, verification).
- **Position:** two forces converge — Section 1071 phasing in demands clean,
  structured, auditable origination data; and generative tooling makes
  synthetic borrowers, altered statements, and forged identity artifacts
  cheap. The platform that can PROVE provenance — of a document, an identity,
  a signature — holds the trust position.
- **Roadmap consequence:** the signer-identity ladder (verification, not mere
  email possession) and document-authenticity checking are not optional
  polish; they are the position itself. Both remain counsel-gated and
  test-mode until reviewed.

## D-4. The long game is infrastructure, not one broker's front end

- **Controlling volumes:** Vol I (constitutional separation of platform from
  licensed party), Vol III (module separability), Vol V (portable evidence).
- **Position, restated as original intent:** community banks are consolidating
  and losing in-house capacity to underwrite complex rural and specialty
  deals. The end state is Furlong as the **screening and evidence
  infrastructure other lenders run on**, not a single broker's portal.
- **Two engineering obligations that follow, and must be enforced in review:**
  1. **Keep the engine free of Furlong-specific assumptions.** The
     property-fit and program-screening logic must never depend on the
     network broker, Furlong's own routing, or any one lender's preferences.
     Module separability gates already exist to prove this and must stay green.
  2. **Keep the evidence trail exportable.** A licensing institution must be
     able to take its own deals' custody records with it, in a portable form,
     without Furlong as an intermediary.
- **The tell that it is working:** a bank asks whether it can run the
  property-fit engine on deals that never came through the portal. Build so
  that the answer can be yes.

---

# Part IV — Afternoon session, founder live testing (2026-08-06, 14:54–17:45)

Every item below was found by the founder testing the deployed staging build,
not by a gate. That is itself the finding worth recording: the gates were all
green while five of these were live. Gates prove what they were told to check.

## C-9. Authority was accepted from the caller, not derived (CRITICAL)

- **Controlling volumes:** Vol II (authority granted, never asserted),
  Vol III-B (GOV-RUNTIME-001), Vol V (replay-safe derivation).
- **Defect:** twenty admin API routes read privilege from the query string —
  `role: params.get("role") ?? "user"`, with `role === "admin" || "governance"`
  granting access. A URL parameter is a claim, not a credential.
- **Resolution:** `src/lib/auth/sessionAuthority.ts` derives role from the
  proxy-verified session email against the operator and professional
  registries. All 20 routes converted; zero claimed-role reads remain.
- **Doctrine to carry forward:** a route may accept a statement of what lane a
  caller *wants*. It may never accept a statement of what the caller *is*.

## C-10. Counterparty lanes opened onto internal operator consoles (CRITICAL)

- **Controlling volumes:** Vol I (activation boundaries), Vol II (minimum
  disclosure), Vol IV (operator surfaces are operator-only).
- **Defect:** the attorney, auditor and sponsor lanes on `/professional-access`
  targeted `/governance`, `/audit-replay` and `/sponsor` — all
  INTERNAL_CHROME_PREFIXES routes rendering the 43-module operator navigation
  (deployment gates, release board packets, billing controls). Only
  `/lender-desk` was purpose-built and correctly excluded from internal chrome.
- **What actually prevented disclosure:** the C-9 perimeter 403. Had C-9 been
  "fixed" first in isolation, the console would have populated with live
  internal data for an outside attorney. Two defects, and the second one was
  the only thing containing the first.
- **Resolution:** all three lanes render a stated absence, not a sign-in link.
- **Doctrine to carry forward:** a counterparty lane must NEVER target a route
  in INTERNAL_CHROME_PREFIXES. A lane reopens only when a scope-limited
  surface exists for it — never by re-pointing at an internal console.

## C-11. A fetch timestamp was published as the data's vintage

- **Controlling volumes:** Vol II (no fabricated certainty), Vol V (provenance).
- **Defect:** the Sussex County resolver stamped `new Date()` as `sourceAsOf`.
  The brief then printed "data 2026-08-06" beside a $629,000 assessment on a
  property under contract at $2,500,000 — presenting a figure of unknown
  vintage as current-as-of-today.
- **Resolution:** null means null, and the brief prints "this source publishes
  no data date — the figures may be years old."
- **Doctrine to carry forward:** a missing provenance date must be STATED. It
  may never be omitted, and it may never be substituted with the retrieval time.

## C-12. Lot area was consumed as building area

- **Defect:** Sussex `SqFeet` (a Tax Parcels field beside Acreage and
  Shape__Area — i.e. lot area) populated `squareFeet`, which the commercial
  income model consumes as leasable building area. Had it populated, NOI would
  have been modelled on dirt.
- **Resolution:** nulled; retained separately as `lotSquareFeet`.
- **Doctrine:** any field feeding a financial model must be verified for
  MEANING at the source, not matched by name.

## C-13. The platform published no opinion of value (founder-directed reversal)

- **Controlling volumes:** Vol II, Vol V.
- **History, recorded because the reversal matters:** the first fix stated the
  absence honestly ("Furlong publishes no valuation"). The founder rejected it
  — publishing a value IS the purpose of that surface. Correct call; a stated
  absence was the right interim containment and the wrong destination.
- **Resolution:** `src/lib/property/marketValueIndication.ts` — assessment
  reconciliation against each jurisdiction's PUBLISHED basis (ratio of market
  value + valuation date), walked forward on the FHFA index, shown as a ±20%
  screening band. Registry is data; an unregistered jurisdiction returns
  "cannot be produced" rather than a guessed ratio.
- **Verified basis:** Sussex County, DE assesses at 100% of fair market value
  as of 1 July 2023 (court-ordered Tyler reassessment, replacing 50% of 1974
  values) — sussexcountyde.gov/reassessment.
- **Doctrine:** where a real market price is known and diverges materially from
  the model, the DIVERGENCE is the headline output and the market price wins.

## C-14. Market status was never stated

- **Defect:** "Official parcel record matched" was displayed under the label
  "Sale status." A visitor could read a full brief on a property that sold last
  week and never learn the platform had no idea.
- **Resolution:** market status always renders; absence of a listing feed is
  stated as such.

## C-15. Signed documents do not exist (OPEN — highest priority)

- **Controlling volumes:** Vol II (ESIGN/UETA retention), Vol V (evidence).
- **Defect:** `api/public/document-sign` writes a signature CERTIFICATE and
  flips the original's status to SIGNED. It never produces the executed
  instrument. Both the broker and the customer can open only the blank form
  plus a separate certificate. No lender or closing attorney accepts that as
  an executed document.
- **Resolution (in progress):** generate a signed counterpart in ONE PDF —
  Furlong-drafted instruments get a real signature block at a defined stamp
  zone (we are the drafting party and own the template); third-party PDFs get a
  non-obscuring margin band plus an appended signature page. `pdf-lib` added.

## C-16. Risk-based credential rotation requires an execution workflow

- **Founder direction:** 30 days for exceptionally privileged or recently
  exposed credentials; 60 days for external API/payment/AI credentials and
  database passwords; 90 days for lower-risk machine secrets with material
  rotation cost; immediately for suspected disclosure.
- **Controlling volumes:** Vol III `TECH-VAULT-001` and `TECH-SEC-001`; Vol IV
  incident and rollback runbooks.
- **Finding:** Secret Manager schedules publish Pub/Sub notifications but do
  not replace provider credentials. A reminder was therefore necessary but
  insufficient.
- **Resolution:** `config/security/secret-rotation-policy.json` is the
  machine-readable authority. `secretRotationWorkflow.ts` implements
  activation, provider/database adapter gates, Secret Manager versioning,
  consumer canaries and rollouts, overlap retirement, rollback, evidence, and
  failure alerting. Provider and database operations fail closed when their
  approved adapters are absent; the source event remains unacknowledged.
- **Live posture:** reminder schedules now match the 30/60/90 tiers. Automated
  execution is not represented as active until the dedicated worker identity,
  provider adapters, and safe dual-key/session behavior are deployed and
  certified.

## G-1. Broker-to-funding-lender submission (RESOLVED IN GOVERNED PACKAGE)

- **Finding:** the deal desk exposes only customer-facing actions (update,
  remind, remind-all, request-signature, upload-begin, upload-confirm). There
  is no path for the broker to package a file and send it to a funding lender.
- **Searched:** all 41 Master Volume PDFs. ZERO hits in Volume II, III, IV or V,
  and zero in the Lender & Capital Complete Edition.
- **Founder amendment received:**
  `Furlong_Lender_Submission_Governed_Implementation_Package.pdf`, received
  2026-08-06, establishes `CANON-LENDER-SUBMISSION-001`,
  `TECH-LENDER-DELIVERY-001`, and `OPS-LENDER-SUBMISSION-001`.
- **Resolution:** the governed immutable package, exact-version consent,
  recipient verification, atomic fail-closed authorization, transactional
  outbox, delivery truth, retry/reconciliation, replay, APIs, and operator
  surface are implemented on branch `build-lender-submission-001`.
- **Live posture:** sandbox testing only. Production credentials, network
  delivery, and adapter promotion remain blocked pending separate human review
  and controlled promotion.

## Standing note on this register's own limits

This register is maintained in-repo. The authoritative Master Volume PDFs in
`~/Documents/Master Build Volume Documents 05-2026/` are an INPUT to the build
and are not modified here — their newest file dates to 15 June 2026. Items
carrying doctrine changes (C-9, C-10, C-11, C-13) and the unscoped requirement
(G-1) require founder authorship into the Volumes themselves to become
governing. Until then they govern the code but not the constitution.
