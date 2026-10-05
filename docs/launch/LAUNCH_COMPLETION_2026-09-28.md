# FURLONG launch completion — 2026-09-28

## Required outcome

The public release includes the free Property Snapshot and the complete $49 automated Property Report. The $49 product cannot be deferred. The existing $249 human-reviewed Decision Report must meet its promised scope before being sold. A customer must identify the correct property, understand sourced findings and uncertainties, save/reopen their work, and receive the correct private report after one payment. Repeated use, failures, refunds, disputes and access isolation must be tested before launch.

No public deployment, sales activation or DNS cutover is authorized by this record. This is an implementation and acceptance record, not a signoff. Nationwide coverage across property types remains the goal; evidence availability determines what can actually be completed without inventing results.

## Baseline and verified infrastructure changes

- Previously deployed source: `ba0550bb9c69ac779b33648a617472883de13a77`; the `c0a846e0` release tree matches it.
- Main received a consolidated September 18 promotion. The 1,138-commit ancestry difference exaggerated the code difference; the original trees differ in eleven files.
- PR #87 repairs Google-managed IAP authentication using a keyless, service-account-signed JWT and existing signer/IAP permissions. It merged at `75c4b569d8e9e4badeb3a64a00092de8ac303fee`.
- Authenticated passive scan run `36502347375` reached staging and completed: 55 passing rules, zero failing rules, twelve new warning-rule groups. This is not a clean security acceptance. Detailed warnings and the discovered application error are tracked in [the security disposition record](STAGING_SECURITY_TRIAGE_2026-09-28.md); candidate-runtime closure remains required.
- PR #88 merged at `81911d9f6f9f9f806a6e303437d2eed591469d64`. Release push/PR verification, PR security and PR CodeQL coverage are restored. The release branch now requires the ten existing main-branch checks plus the new paid-order database acceptance check, strict base freshness, conversation resolution and linear history; administrator enforcement is enabled, force-push/deletion disabled. Review-count policy was preserved, not replaced with an invented approval.
- Staging sales/delivery flags remain off, order capacities zero, and `furlongpathways.com` remains reserved. No application revision or DNS was changed for these workflow repairs.

## Report and runtime implementation

- The portal and report preparation share one server-owned property-facts resolver. Parcel classification precedes lane-specific narratives; a farm must not inherit homebuyer answers or financing copy.
- Long-range economics now deduct any remaining loan principal at maturity and stop scheduled payments at actual payoff. Blocked uses cannot outrank viable/conditioned uses on income alone. Regression tests cover both.
- Browser report models, object references, prices and digests cannot authorize payment. Only an owner-authorized, completed property-comparison evidence package can supply economic inputs. Economic packages and reviewed exclusions are revalidated against property identity, exact address, source freshness at report generation, distinct candidate roles and supported calculations.
- A preliminary investigation outline remains an internal review output. It cannot authorize payment. Missing economic evidence is not replaced with zeros or generic planning scores.
- The report is rendered, safety scanned, structurally checked, written once to private storage, read back and hashed before Stripe checkout is created. Order, artifact, source snapshot, report model and digests are retained together.
- Distinct signed confirmations of the same payment preserve processing/completion; they cannot reset a finished report or replenish a consumed grant. Payment during a pending refund cannot reopen fulfillment. Supervised completion retries remain idempotent, and the manual fulfillment path cannot bypass automated-report verification.
- A signed valid payment releases the prepared automated artifact atomically. Missing/mismatched artifacts produce a held order and no access grant. Replay, refund and dispute processing share the order lock with report operations.
- Every download checks ownership, paid/fulfilled status, revocation, size and actual SHA-256; automated objects are read by pinned storage generation. Old client-authored export routes cannot issue paid reports.
- Browser retries retain both the request identifier and a separate recovery secret. The exact provider request is frozen before submission and replayed only inside a bounded idempotency window. The request identifier alone never grants access.
- Staging `/discover` failed while trying to write generated evidence into the read-only source-state bucket. Request-time evidence capture now appends signed historical captures to the existing database replay ledger. The web identity's source-bucket permissions remain read-only. Control-plane invalidation jobs retain their separate registry. Customer-submitted captures are labelled assertions, never verified facts.
- The mobile single-property entry now uses readable 16px input text and controls at least 48px high. Desktop (1440px) and mobile (390px) browser checks passed for opening intake, empty-address rejection, no horizontal overflow and no page errors. These are bounded local checks, not full customer acceptance.
- The report no longer assumes every property is a government sale. Continued PDF paragraphs and source references stay within the text column.
- The development-only `ip-address` dependency was updated to 10.7.2 to address two open moderate advisories.
- Dotted application paths no longer bypass the proxy's authentication and CSP. The unnecessary framework-identification header is disabled.

## Acceptance evidence required before activation

| Gate | Required proof | Current disposition |
| --- | --- | --- |
| Release verification | Full Verify, security checks, CodeQL and isolated paid-order database tests pass for the final commit | Workflow repairs merged; implementation verification in progress |
| Report substance | Real-property samples for each launch type/geography; supported single-use, mixed-use and selected-vision analysis; source dates, factual checks and useful conclusions | NOT ACCEPTED. The reviewed NY farm has verified parcel facts but lacks complete operating/comparison evidence |
| Source-to-analysis pipeline | Supported evidence packages populated from approved sources for normal customer intake, with explicit handling of unsupported properties | BLOCKING. Existing comparison compilation accepts complete packages; ordinary intake does not reliably populate them |
| Customer journey | Desktop/mobile discovery, address mismatch, classification correction, missing data, saves/reopens, return visit and actual report review | Pending candidate-runtime and owner testing |
| Payment | Stripe test-mode checkout, cancel, signed completion, failed/late/replayed events, recovery after lost response, $49 delivery, $249 fulfillment, credit, capacity and operator refunds | Isolated database tests passed, including concurrent replay, delivery bytes, wrong-owner denial, altered-file rejection, held-order refunds, refund/dispute revocation and capacity. Storage/provider responses in that test are synthetic; actual provider/runtime acceptance remains pending |
| Storage/scanner | Candidate runtime can generate, scan, write once, re-read and privately deliver the exact PDF; wrong owner/tampered bytes denied | Contract implementation present; runtime proof pending |
| Runtime repair | Revisit the failing canonical-property `/discover` request and lineage capture under existing restricted runtime identity | Code repair prepared; fresh deployed proof pending |
| Independent review | Appointed reviewers and required role-separated signoffs; no assistant-generated approval | Pending human appointments and signoffs |
| Commercial promise | Approved cost/margin record, $49 scope, $249 capacity/delivery window, purchase/refund terms and support owner | Existing approval gates retained; owner/reviewer acceptance pending |
| Public edge | Reviewed HTTPS configuration, domain control/MFA, canonical URL, protected operator routes, monitoring and rollback test, final explicit approval | Last stage; `furlongpathways.com` unchanged |

## Ordered remaining critical path

1. Keep one candidate release and finish required checks; prioritize demonstrable source coverage without silently narrowing the nationwide objective.
2. Complete approved-source collection into property-specific economic/use packages for normal single-property intake. Reject an unready purchase honestly; do not sell the investigation outline.
3. Validate real properties and finished reports, including bad addresses, stale/conflicting sources, adverse findings and insufficient-data cases. Correct factual, calculation and usability defects before product acceptance.
4. Verify the candidate privately with sales off. Prove the full Stripe test-mode journey and both products' delivery, recovery, refund/dispute, credit and capacity behavior. Re-run authenticated scanning and resolve material findings.
5. Record owner acceptance, commercial approval and independent signoffs against those exact artifacts and the final release commit.
6. Complete edge/domain/rollback acceptance and obtain explicit launch approval. Only then change public routing and approved sales flags.

A passed build, a generated PDF, or a successful passive scan is not evidence that the complete product is ready for customers.


## October 5 continuation: evidence-backed candidate exclusions

Resumed the interrupted exclusion work. The property report now permits zero to three economic candidates only when reviewed, current, property-bound negative findings close the remaining single-use, mixed-use and vision/alternative decision roles. Missing data never closes a role. Each exclusion preserves the reviewed scope, considered uses, source rights and dates, confidence, classification, trace and replay references. No economics are invented for ruled-out uses.

The private worker, authorized operator endpoint, durable comparison and child case, report-preparation view, checkout snapshot and report PDF now carry the same exclusions. Finalization and purchase re-evaluate freshness. Customers can see no-go findings before payment; an exclusion-only report describes the scoped negative conclusion instead of offering a viable-use recommendation. A partially evidenced competing use cannot disappear behind a complete winner.

Verification includes zero/one/two/three candidate cases; stale, wrong-property, future, unreviewed, unauthorized and malformed evidence; persisted source lineage; worker handoff; report rendering; and wrong-customer access. Synthetic fixtures prove implementation behavior only. Live-source economic completion, real Stripe/storage acceptance, owner acceptance and independent launch approvals remain open. No public activation is authorized by these checks.


The completed-report PDF now discloses acquisition/startup costs, all thirteen operating expense categories and their separate escalation rates, revenue growth, staffing and owner time, loan/cash/other-capital reconciliation, scheduled debt and maturity payoff, milestone cash flows, and each input's method/source references. Cumulative operating cash flow is explicitly distinguished from investment profit and excludes resale/appreciation assumptions. These schedules are part of the frozen report model and digest; exclusion-only reports do not invent them. Synthetic reports with zero/one/two/three economic uses contain 5/9/13/18 pages; all eighteen pages of the full fixture were visually inspected, and all variants passed page-boundary checks.

Local production build, TypeScript and report contracts passed after this addition. Mobile (390px) and desktop (1440px) browser checks show the documented no-go findings before payment, no invented candidate selector, no horizontal overflow, and a disabled payment action when evidence remains missing even after agreement acceptance. These browser responses are synthetic. The merged candidate's expanded real-PostgreSQL suite also passed; the updated final commit must retain its own CI results.

A live read of the existing Stripe test account found only four of the ten required event subscriptions. The test endpoint `we_1U1fTcDVUdDb7LlbcxGHy7CE` was updated and read back on October 5 to include delayed-payment success/failure, checkout expiry, charge refunds, failed refunds and dispute closure. Its URL, enabled state, existing subscriptions and test mode were preserved. This corrects test configuration; it does not prove signed event processing, enable public sales or establish live-mode acceptance. API reference: https://docs.stripe.com/api/webhook_endpoints/update.
