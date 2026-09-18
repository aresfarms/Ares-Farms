# Runbook — Stuart End-to-End Testing Run (staging)

**Purpose:** Give Stuart a full, real end-to-end run of the platform in **staging** — his onboarding + testing pass. Scope is *Alpha-equivalent* but this is **NOT official Public Alpha** (only Stuart tests; no other participants; no reliance). After his run: make changes → you + Stuart review → *then* open official Alpha (target ~Labor Day, currently uncertain).

**Written for the operator (Caitlin).** You do not need to read code to follow this. Steps you run are in `staging`. Claude cannot run these — there is no staging project/auth in the build session — so each is yours to execute.

**Non-negotiables this run preserves:** production stays **BLOCKED**; no live external actions; no payments; no real regulatory reliance; the official Alpha 2-of-3 sign-off is **not** faked — it stays `PENDING_SIGNOFF` and is completed properly *after* Stuart tests.

---

## Key facts (verified from code, 2026-08-12)

- **Staging URL:** `https://furlong-core-859763772114.us-central1.run.app`
- **Access model:** Google sign-in behind IAP. `sfraas@aresfarmsinc.com` is allowlisted; a non-allowlisted account is walled at Google sign-in and the app never renders.
- **Stuart's identity:** `sfraas@aresfarmsinc.com` (one "s") — the canonical, wired-in address. **`stuart@aresfarmsinc.com` is retired — do not use.**

---

## Part A — Let Stuart in (this is what actually unblocks his testing)

A closed staging test is gated by the **allowlist**, not by the Alpha sign-off ceremony. So this Part is all Stuart needs to start.

1. **Confirm `sfraas@aresfarmsinc.com` is on both staging allowlists.** (Reported done 2026-07-29; confirm it's still live — these live in gitignored tfvars / GCP, so Claude can't see them.)
   - `iap_tester_principals` (IAP — who gets past Google sign-in)
   - `auth_credential_email_allowlist` (app credential mode)
2. **Confirm the latest code is deployed to staging** (the branch you've been hardening — `build-document-signature-professional-access-001`). If staging is behind, deploy first, or Stuart tests stale behavior (the same trap that started this whole session).
3. **Send Stuart:** the URL above + "Sign in with Google as `sfraas@aresfarmsinc.com`."
4. **Generate his testing checklist** (already built — produces a PDF he follows):
   ```bash
   npx tsx src/scripts/generateTesterSignoffChecklist.ts
   ```
   It covers the end-to-end path: sign-in → borrower intake form → the honest "0% down — possible for some buyers" callout → intake submits → the deal notification reaches `sfraas@aresfarmsinc.com`, plus his lender-side non-binding review.

**What "end-to-end" covers** (the Alpha ON set): borrower intake · document upload + completeness · advisory completeness checks · human review/transition · in-app notices (no external send) · advisory program/opportunity surfacing · data accounting/export · append-only audit + replay · watermarked advisory export · Stuart's lender non-binding review.

---

## Part B — (Only if his run needs it) Enable your staging launch-authorization override

You only need this if Stuart's run must exercise features gated behind the **production-launch authorization blockers** (P5-B01…B10: named-tester, PII, financing, connectors, official report, payments, security, DB recovery, domain/cutover). Basic borrower + lender-review testing does **not** need it — Part A is enough. Use this to dry-run the launch-decision flow without all 10 real authorities.

This is your own governed mechanism (`recordStagingUltimateAuthorityOverrides`). It is honest by design: every entry it writes is stamped *"STAGING TEST OVERRIDE ONLY. This is not a genuine authority approval and cannot authorize production launch."* and `productionAuthorized` stays `false`.

**Prerequisites (staging deployment env — confirm these are set):**
- `LAUNCH_TEST_ULTIMATE_AUTHORITY_ENABLED=true`
- `LAUNCH_TEST_ULTIMATE_AUTHORITY_EMAILS` includes `chudson@aresfarmsinc.com`
- `GOOGLE_CLOUD_PROJECT=furlong-staging-499102` (the tool refuses to run anywhere else)

**Trigger it** (signed in as yourself, in staging) — either:
- **Console:** open `/launch-authorization`. It shows `testAuthorityEnabled` and the rollup; use the "staging test override" action.
- **API:** `POST /api/governance/launch-authorization-decisions`
  ```json
  { "action": "STAGING_TEST_OVERRIDE_ALL", "evidenceRef": "stuart-e2e-onboarding-2026-08", "ttlMinutes": 1440 }
  ```

**Guardrails baked in:** staging-only; time-bounded (default 8 hours, max 24); it releases the *test* rollup only (`productionAuthorized: false`, `finalLaunchHoldReleased: false`). If Stuart's run spans more than a day, re-run it — it's meant to expire.

---

## Part C — After Stuart's run

1. Collect his findings (the checklist doubles as his sign-off/feedback sheet).
2. Make the changes his run surfaces.
3. **You + Stuart review together.**
4. *Then* open official Public Alpha — which needs the real steps that are intentionally NOT part of this run:
   - the **2-of-3 founder sign-off** (Stuart signs for real now that he's tested — your planned sequencing),
   - a **qualified independent environmental reviewer** assigned (your §9 #3 = "featured" precondition),
   - **DR-restore test** recorded + **signed Alpha participation terms**.

---

## What Claude did / did not do (for the record)

- **Did:** record your §9 decisions and your signature line in `DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md`; write this runbook.
- **Did not:** forge Stuart's vote, or hand-flip the Alpha ceremony's `PENDING_SIGNOFF`. Those stay honest. Your staging override (Part B) is a real, separate, governed tool — not a bypass of the Alpha ceremony.
