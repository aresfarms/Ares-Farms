# Master Volume scoped amendment: the Furlong Answer and customer experience
Date: 2026-09-08
Change ID: MVS-CUSTOMER-EXPERIENCE-2026-09-08
Authority: owner approved the eight attached recommendations with “Agreed make it happen.”
Source baseline: cc46a1ceeaad1b0ec8e51441c4a490ae44472962, release/r7-logo-20260907.

## Scope and precedence

Extends the September 5 Product Coherence and Platform Experience/Economics amendments. For the public opening only, the open question and optional examples supersede older map-first, category-first, banner-first and retired CSS-class requirements. The map and full exploration remain reachable. This does not repeal accessibility, consent, security, source or verification requirements.

Historical Master PDFs remain unchanged. This is an implementation amendment and record, not independent legal advice, security certification, professional approval or evidence of paid market adoption.

## Governing requirements and implementation

1. TECH-UX-001 / CANON-CLAIMS-001: one recognizable five-question Furlong Answer across the property workspace, privately saved case and personal export. Shared projection version furlong-answer-v1.0.0. Questions: what appears possible; what available numbers support; what could prevent it; what remains unverified; next useful action. No forced positive recommendation.
2. CONST-CONSENT-001: start with an editable question and three optional examples. Exploration does not require account creation. Device/tab continuity, account saving and provider sharing remain separate choices. Do not persist the Navigator transcript as a private case.
3. TECH-PROV-001: explicit comparison of up to three customer-selected properties, stored only in the current tab after the customer adds them. It is not the sales-comparable/BPO engine. Missing evidence stays pending; no assessment fallback or automatic winner.
4. TECH-RBAC-001: case list is owner-scoped. Read/write handlers enforce durable record ownership and existing authorized oversight roles. Customer-supplied snapshots cannot certify evidence or outcomes. Query parameters cannot claim review or approval. Newly saved cases receive server-generated identifiers; upsert cannot transfer ownership.
5. TECH-EXPORT-001: saved-case personal export requires sign-in, exact ownership, current record-version confirmation, and explicit personal-download acknowledgment. The server uses saved record data, not client-provided report content. A deterministic ZIP contains dated PDF, printable HTML, machine-readable JSON and a SHA-256 file manifest. A durable canonical audit event records requester, scope, export time, consent version, source record version, manifest/package hashes and exact replay input before bytes are released. Missing audit persistence blocks the download. Hashes establish integrity, not correctness or certification. No source document bytes, recipients, provider grants or delivery are included. Downloaded files cannot be revoked remotely.
6. TECH-UX-001 / evidence truth: the return screen shows recorded changes, attention, next responsibility and waiting state. Unknown owners or waiting states say not recorded. No inferred completion percentage. Optional remembered visit times stay on the device. Saved answers explicitly say they have not been refreshed or independently re-verified.
7. Source governance: four general-preparation guides carry authorship, source-check date, jurisdictional limits and primary-source links. No unverified PE/discipline attribution, lender endorsements or invented customer examples. Editorial review and actual professional acceptance remain distinct.
8. Economic doctrine: free customer core is separate from commissioned professional work and organizational workflow contracts. No referral, approval, rate, loan-amount or closing-based compensation, paid ranking or sale of customer files is introduced. Fixed service scope, payer, price, capacity, acceptance and refund terms must be agreed before charging. This release does not create prices, subscriptions or institution contracts.

## Source map and proof

- Entry: src/components/public/FurlongStart.tsx; src/app/(public)/page.tsx.
- Shared answer: src/lib/property/furlongAnswer.ts; src/components/property/FurlongAnswerCard.tsx.
- Comparison: src/components/property/PropertyComparison.tsx.
- Private cases: src/app/api/intelligence/cases; src/lib/intelligence/furlongCaseStore.ts; src/components/intelligence/LivingFurlongCasePanel.tsx.
- Export: src/lib/intelligence/furlongAnswerExport.ts; src/app/api/intelligence/cases/[caseId]/export/route.ts; existing canonical writeAuditEvent.
- Guides: src/lib/public-content/practicalGuides.ts; src/app/(public)/guides.
- Commercial positioning: src/app/(public)/professional-access/page.tsx; shared public disclosures.
- Proof: npm run verify:customer-experience; npm run verify:customer-property-experience; npm run verify:accessibility; npm run verify:navigator-state-integrity; npm run verify:public-copy-integrity; npm run verify:master-volume-build-parity; npx tsc --noEmit; npm run build.
- Machine mirror: docs/customer-experience-release.json.
- Operating plan: docs/runbooks/FURLONG_ORGANIZATIONAL_PILOT_2026-09-08.md.

## Status and gates

Source implementation and local tests are not cloud deployment. Read docs/customer-experience-release.json and the dated build record for the observed release state. No schema migration is added; existing case and immutable-audit tables must be present for saving/export to work.

The full BPO workflow, all-platform calculation audit, remaining legacy report/export problems, independent production-security assurance, original Secret Manager incident resolution and broad Master Volume parity are NOT certified by this amendment. The new answer does not supply absent price, income, soil or loan evidence. A saved snapshot is customer-supplied context and its evidence labels are conservatively downgraded on return/export.

Stuart's existing access is preserved pending the owner's explicit decision. He is not a prerequisite for this experience, and no onboarding or access certification is claimed.

Controlled testing may proceed only through existing release, scan and authorization gates. Ordinary traffic promotion and unrestricted public launch remain separate decisions. Test real sign-in, owner-scoped saving, version-conflict handling, audit persistence and export on the deployed revision before claiming those cloud workflows work.
