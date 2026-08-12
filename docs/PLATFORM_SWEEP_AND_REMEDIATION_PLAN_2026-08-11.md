# Platform Sweep + Remediation Plan — 2026-08-11

Swept against the code deployed at manifest `2026-08-11T19-07-46-995Z-78e535d`,
so findings describe what is actually running.

---

# PART I — NEW FINDINGS

## S-2. A customer who submits an intake receives NOTHING (P0)

**The single most consequential finding in this sweep.**

On submission, `/api/financing/intake` mints a secure-upload token and returns
`secureUploadPath` and `serviceRequestId` **in the HTTP response body**. It then
calls `notifyOnServiceRequest`, which — despite the name — emails only the
routed professional. `recipientFor()` maps a routing spoke to an env-configured
staff address; a customer can never be a recipient.

Every customer-reaching email in the codebase is BROKER-INITIATED: Stuart
sending a link, a reminder, a document, or a post-signing receipt. Nothing is
sent when the customer acts.

So the customer's reference number and secure-upload link exist **only on the
screen in front of them**. Close the tab and both are gone.

The recovery paths do not close the loop:
- `/status` needs the reference number, which was in the response they lost.
- Reference recovery is deliberately routed to Stuart (founder decision) — but
  the customer must quote a reference to ask for help, and they have none.
- A fresh upload link can only be issued from the deal desk, which requires the
  customer to reach Stuart first.

This is the mechanism behind the founder's own earliest testing complaints in
this build ("I uploaded the document but have zero idea if it worked or where
they went"). It is not a UI polish item; the journey has no durable handoff.

**Fix:** send the customer a confirmation email on intake carrying (a) the
reference number as a naked copyable line, and (b) the secure-upload link.
The infrastructure exists — `sendEmail` and the Gmail path are live and used by
five other flows. What is missing is a customer-addressed template and the call.

## S-1. The API perimeter is default-open by directory (P1)

`/api/public/*` is a blanket prefix exemption in `apiSecurityPolicy.ts`. **26
routes** are outside the perimeter because of where their file sits, not
because anyone decided they should be. File 27 inherits publicity for free.

This is the identical polarity error `PlatformChrome` documents having already
made and fixed for page chrome: *"Polarity matters… The previous design
allowlisted public routes and leaked internal chrome onto anything it forgot to
list. Never again."* The page chrome was corrected; the API perimeter was not.

**Not live-exploitable today** — IAP fronts staging and every probe returns 302.
The mask comes off at launch.

The sensitive routes each defend themselves, to their credit:

| Route | Guard |
| --- | --- |
| `local-founder-password-bootstrap` | non-production AND localhost, else 404; refuses if password already set |
| `professional-test-persona` | synthetic-fixture flag AND caller email equals the test email, else 404 |
| `anon-token/[action]` | genuinely public by design; no PII required to mint |

The defect is structural, not a live hole: every one of those guards lives
INSIDE its route, and the perimeter contributes nothing.

`apiSecurityPolicySmokeTest` asserts only that ONE example route resolves via
the prefix. It would not notice 26 becoming 27.

**Fix:** enumerate each public route explicitly, plus a gate that fails when a
file under `src/app/api/public/` is not listed. Same shape as the
`INTERNAL_CHROME_PREFIXES` allowlist that already works.

## S-3. The Sovereignty Guarantee's scope (P2, counsel-adjacent)

> "**No sale.** We never sell, broker, or hand your information to a third party."

Rendered only on `/discover`, the anonymous property report — where it is
**true**: no account, no PII, nothing handed anywhere.

The risk is scope, not accuracy. A visitor reads it on the report page and then
enters the financing journey, where identity documents go to Stripe, bank
credentials to Plaid, and the whole file to Stuart — a separate legal entity.
Those are disclosed processors and a chosen recipient, not sales, but a reader
carrying the sentence forward would be surprised.

**Fix:** scope the claim to the surface it appears on, and state the financing
journey's named processors where PII is actually collected. Wording, not
retraction.

---

# PART II — REMEDIATION PLAN

Ordered by "who is harmed and how soon", not by effort.

## P0 — before Stuart's session

1. **S-2 customer intake email.** Reference + upload link, customer-addressed.
   Without it every tester and every launch customer loses their own file.
2. **Reference recovery request → Stuart** (four rules already recorded: reissue
   only to the email on file; callback on the number on file; "new email" is an
   account-takeover request needing a fresh application; every reissue is a
   governed event). S-2 reduces how often this is needed; it does not replace it.

## P1 — before public launch

3. **S-1 perimeter allowlist + gate.** Its own focused pass; the perimeter is
   the highest-stakes module in the codebase.
4. **Upload session hardening** — device binding, idle timeout, close-out
   summary email with file hashes. Designed and founder-approved; not built.
5. **Key rotation** (task #33). SendGrid key is known-exposed.
6. **Attorney / auditor / sponsor scoped surfaces.** Three lanes currently
   render honest "not open yet" notices. They stay closed until built — a door
   onto the wrong room is worse than no door.
7. **S-3 claim scoping.**

## P2 — scheduled, not urgent

8. **Broker→funding-lender transmittal.** Appears NOWHERE in the 41 Master
   Volume PDFs. Needs founder authorship before code, or the requirement is
   being invented by its implementer.
9. **Delaware LULC classifier** — statewide land-use layer verified working;
   would stop the property-type question across all three DE counties.
10. **Square-footage input**, **participating-lender copy**, **per-page band on
    edge-to-edge documents**.

## Blocked on things outside the code

- **Apple Pay** cannot complete domain verification behind IAP; Stripe must
  fetch `/.well-known/…` publicly and gets a 302.
- **Wallets** require real physical-device journeys per the 2026-08-10 closure
  record; neither can be closed on staging.
- **Sussex land-use code table** — not published anywhere reachable; one email
  to the county assessor unblocks 200,000 parcels.

---

# PART III — THE METHOD LESSON FROM THIS SESSION

Three checks of mine reported success while measuring a proxy: a gcloud format
path that returned EMPTY instead of erroring, a grep for PDF text that returns
zero on text that renders fine, and an `EXIT: 0` that was `tail`'s exit code
rather than the script's.

Each would have shipped a false green. The standing rule that follows:

> **A gate that has never failed has not been verified.** Every new check gets
> negative-tested — break the thing deliberately, watch the check go red, then
> restore.

Applied twice already: the migrator gate (run before the job on two separate
deploys, red both times) and `verify:plaid-link-security` (identity gate removed
→ red; route re-deriving its own session → red; restored → green).
