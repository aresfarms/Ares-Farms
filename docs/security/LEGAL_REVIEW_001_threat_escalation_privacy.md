# LEGAL-REVIEW-001 — Threat-Escalation Privacy Exception

**Status:** REQUIRED for counsel review before public launch. Not legal advice; a build-side
description of the implemented mechanism and the open questions for counsel.

## Issue

Furlong's public doctrine promises anonymous use, no visitor identification, no user dossiers, no
sale of visitor information, and no tracking-based profiling. The threat-escalation subsystem
(`src/security/realityPlatform/threatEscalationLedger.ts`) creates a **narrow exception**: when a
credible violent-threat, targeted-harassment/stalking, or infrastructure-security-probe event is
detected, limited network/security metadata is recorded for platform safety and human review.

## What is recorded today (per event)

- anonymous per-event identifier (`eventId`, random UUID — not a cross-session visitor id)
- timestamp
- triggering message **hash only** (never raw text)
- phrase category (bombing / arson / shooting / assault / sabotage / terrorism / stalking /
  harassment / doxxing / infrastructure-probe)
- route/refusal decision (`ESCALATE_VIOLENT_THREAT` / `ESCALATE_TARGETED_HARASSMENT`)
- network identifier (`x-forwarded-for`/`x-real-ip`) **where legally available**
- user agent
- page/route
- replay reference (hash)
- rendered response hash
- review status: `NEW | UNDER_REVIEW | FALSE_POSITIVE | ACTION_REQUIRED | CLOSED`

Raw private content (e.g. an address typed alongside a stalking request) is **never** stored — only
its hash. The ledger is server-side and append-only (hash-chained); no public UI exposes it.

## Questions for counsel

1. **Public privacy disclosure** — approve final wording of an explicit exception, e.g.:
   "Furlong is designed for anonymous use. The limited exception is that credible threats of
   violence, terrorism, stalking, targeted harassment, or similar security events may be logged for
   platform safety, legal compliance, and human review."
2. **Retention** — set retention period, purge schedule, review workflow, false-positive handling,
   closure requirements. (Build default placeholder: `THREAT_RETENTION_DAYS = 365`, purge-eligible
   once `FALSE_POSITIVE`/`CLOSED` — subject to counsel revision.)
3. **Action policy** — when logging alone suffices; when human review is required; whether any
   reporting obligations exist; escalation authority; documentation requirements.
4. **Metadata scope** — confirm whether network identifier, user agent, timestamp, session id,
   route, message hash, response hash are appropriate; determine whether any field should be
   removed, shortened, salted, hashed, truncated, or retained.
5. **Anonymity-doctrine reconciliation** — confirm the exception stays narrow, safety-based,
   non-commercial, non-profiling, non-marketing, and never evolves into ordinary visitor tracking.

## Interim rule (in force until counsel review)

- threat metadata is **isolated** from analytics, marketing, and user profiling (separate ledger,
  not read by `abuseTelemetryDashboard` beyond an anonymous count);
- no public UI exposes threat records;
- no automated reporting policy is assumed;
- human review remains required.

## Constitutional principle

Anonymous exploration remains the default. Threat escalation is an exceptional safety mechanism,
not a visitor-tracking system.
