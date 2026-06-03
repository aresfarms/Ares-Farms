# Operator Demo Seed and Handoff

## Purpose

This document explains the governed demo seed and handoff view for the completed
Modules 01-32 internal build.

The seed creates one coherent internal demo case so the operator workspaces can be reviewed without relying on scattered smoke-test records. It is not a production launch step. It is a controlled internal handoff tool aligned to the Master Volume Series.

## Master Volume Alignment

- Volume I: creates accountable records with traceable authority.
- Volume II: keeps borrower, lender, sponsor, report, and agency-adjacent records advisory-only.
- Volume III: uses the same backend API routes that produce replay, version, classification, observability, and evidence records.
- Volume IV: supports operator training, handoff, audit preparation, exception review, and recovery workflows.
- Volume V: preserves canonical doctrine boundaries for classification, explainability, source authority, controlled disclosure, evidence, replay, and version governance.
- Volume VI: preserves source intelligence, legal/licensing review, public DTO boundaries, conformance, and portable surface alignment.

## What The Seed Creates

The seed creates a single governed internal demo case:

- Borrower onboarding record.
- Submitted application event.
- Document metadata record.
- Document storage handoff record.
- Operator review queue item.
- Advisory USDA/FSA source check record.
- Rule overlay evaluation record.
- Human review and adverse-action candidate records.
- Credentialed agency ingestion readiness record.
- Environmental compliance review posture is surfaced through the governed
  environmental compliance admin API when records exist.
- Live scraper activation posture is surfaced through the governed activation
  gate and remains blocked.
- Source legal/licensing review posture is surfaced through the governed review
  gate and remains blocked without providing legal advice.
- Source promotion packet posture is surfaced through the governed packet gate
  and remains blocked without source activation approval.
- Source production readiness posture is surfaced through the governed
  controlled-promotion readiness gate and remains blocked without qualified
  production approval.
- Controlled promotion activation posture is surfaced through the governed
  activation ceremony review gate and remains blocked without executing an
  activation ceremony.
- Production portal readiness posture is surfaced through the governed launch
  preflight gate and remains blocked without launching the portal, enabling
  public verification, capturing payments, sending notices, publishing official
  reports, or performing live external actions.
- Production launch evidence posture is surfaced through the governed go-live
  evidence packet and remains blocked without releasing go-live, launching the
  portal, enabling public verification, capturing payments, sending notices,
  publishing official reports, or performing live external actions.
- Deployment environment readiness posture is surfaced through the governed
  deployment environment gate and remains blocked without approving a release
  candidate, executing deployment, activating production secrets, cutting over
  public DNS, running production database migrations, or releasing go-live.
- Release candidate freeze posture is surfaced through the governed freeze plan
  and remains blocked without approving a freeze, freezing a release candidate,
  executing deployment, activating production secrets, cutting over public DNS,
  running production database migrations, or releasing go-live.
- Production cutover hold posture is surfaced through the governed cutover hold
  gate and remains blocked without approving or executing cutover, releasing
  launch/deployment/freeze holds, executing deployment, activating production
  secrets, cutting over public DNS, running production database migrations,
  exposing public production APIs, or launching the portal.
- Production release board posture is surfaced through the governed release
  board evidence packet and remains blocked without approving the release board,
  granting cutover authority, releasing launch/deployment/freeze holds,
  executing deployment, activating production secrets, cutting over public DNS,
  running production database migrations, exposing public production APIs, or
  launching the portal.
- Lender workflow record.
- Sponsor workflow record.
- Three advisory report records:
  - Demo operator briefing.
  - Exception remediation memo.
  - Borrower portability package summary.

## What The Seed Does Not Do

The seed does not:

- Create an official report.
- Send a borrower notice.
- Issue a final decision.
- Capture a payment.
- Perform a live external agency call.
- Perform a live scraper/source fetch.
- Provide legal advice or approve source licensing, ToS, anti-bulk acquisition,
  retention, republication, or public display.
- Approve source promotion, live source activation, source certainty, or public
  verification.
- Approve source production readiness or execute an activation ceremony.
- Approve or execute a controlled activation ceremony.
- Launch the production portal.
- Release go-live.
- Approve production cutover.
- Execute production cutover.
- Approve the production release board.
- Grant production cutover authority.
- Release the final launch hold.
- Approve a release-candidate freeze.
- Freeze a release candidate.
- Approve a release candidate.
- Execute deployment.
- Activate production secrets.
- Cut over public DNS.
- Run production database migrations.
- Enable public production API exposure.
- Accept or store raw document contents.
- Enable public verification.
- Process sovereign data.
- Authorize production use.

## How To Run It

Open one terminal in the Ares-Farms folder and start the app:

```bash
npm run dev
```

Leave that terminal running.

Open a second terminal in the same Ares-Farms folder and run:

```bash
npm run demo:seed
```

The command prints a summary with the demo `applicationId`, `borrowerId`, `tenantId`, record IDs, trace IDs, and the safest routes to review next.

## In-App Handoff

After running the seed, open:

```bash
/operator-demo
```

This page reads the governed records through backend admin APIs and gives an internal walkthrough order across the completed module set. It does not run the seed command for you and it does not bypass production gates.

## Routes To Review After Running

Use these routes for the internal demo walk-through:

- `/operator-demo`
- `/module-readiness`
- `/case-command`
- `/applications`
- `/documents`
- `/operator-queue`
- `/reviews`
- `/rules`
- `/connectors`
- `/source-ingestion`
- `/environmental-compliance`
- `/live-scraper-activation`
- `/source-legal-review`
- `/source-promotion-packets`
- `/source-production-readiness`
- `/controlled-promotion-activation`
- `/production-portal-readiness`
- `/production-launch-evidence`
- `/deployment-environment-readiness`
- `/release-candidate-freeze`
- `/production-cutover-hold`
- `/production-release-board`
- `/partners`
- `/reports`
- `/exception-remediation`
- `/data-rights`

## Operator Interpretation

When the seed completes successfully, it means the completed module set can consume backend records through governed internal routes.

It does not mean the platform is ready for public release, live external agency calls, live payments, official notices, or final lending decisions. Those remain blocked until the separate production activation gates pass.

## Verification Commands

Use these commands after changing backend or module code:

```bash
npx tsc --noEmit
npm run build
```

Use this command when the app is running and the database is available:

```bash
npm run demo:seed
```

Use the full backend verification gate before any production-facing claim:

```bash
npm run verify:backend
```

## Current Boundary

Modules 01-32 are complete for governed internal operation.

The next work after this handoff is operator user experience polish, demo readability, and production activation readiness. New product modules should not bypass the completed backend surfaces or weaken the Master Volume boundaries.

Live scraper, connector, source-stack, marketplace, property, revenue, or public
source execution must not move forward until `/api/governance/source-legal-review`,
`/api/governance/source-promotion-packets`,
`/api/governance/source-production-readiness`,
`/api/governance/controlled-promotion-activation`,
`/api/governance/production-portal-readiness`,
`/api/governance/production-launch-evidence`,
`/api/governance/deployment-environment-readiness`,
`/api/governance/release-candidate-freeze`,
`/api/governance/production-cutover-hold`,
`/api/governance/production-release-board`, and the live-action readiness
gates show qualified human approval for the exact source, use, licensing scope,
ToS posture, anti-bulk controls, retention, republication, public display,
replay, provenance, adapter, monitoring, rollback, incident response, audit
export, activation ceremony, post-activation verification, kill-switch
requirements, public-copy freeze, auth/security readiness, support routing,
qualified review, release ceremony, deployment environment release,
release-candidate freeze approval, production cutover approval, production
release board approval, cutover authority grant, and final launch-hold release.
