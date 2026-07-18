# Tier boundary — settled by the Master Volumes; what Stuart validates

**Status (2026-07-18):** the who-pays question is NOT open — the Master Volume
Series decided it, and the build now implements that decision. What remains for
Stuart is validating the institutional side, which is his bailiwick.

## The constitutional answer (implemented)

From the Borrower Complete Edition and Volume 0 §7.5 (Revenue Model), with
ECON-CONFLICT-001 (Vol I §3.34) making revenue neutrality constitutional:

> **"Furlong is free for borrowers. No fees, no charges, ever."** No
> application fees, service charges, or per-transaction costs to borrowers at
> any point in the process.

> **"Furlong is paid by the institutions** — lenders, agencies, partners — for
> access to the platform infrastructure. The pricing model is **institutional
> subscription-based** — a platform access fee, not a per-transaction or
> per-loan charge. Platform pricing is not tied to loan outcomes."

Vol 0 §7.5 revenue streams (all institution-side): SaaS platform licensing
(tier-based by participant scale), per-transaction *governance* fees,
certification & onboarding, government program coordination, advisory &
implementation, premium compliance services.

**Therefore:**
- The borrower-side "token fee for the PDF" idea is dead — it would breach the
  founding commitment. Everything the borrower touches is free, including
  their watermarked export, forever.
- The **clean (watermark-free) institutional export** still exists — but it is
  an **institution-side deliverable**: produced when a participating
  institution coordinates the borrower's file, covered by that institution's
  subscription. The borrower never buys it; their lender's platform access
  includes it.
- The free brief's closing now states this plainly (paid by institutions,
  never by you, never outcome-linked — see `reportTierIdentity.ts`).

## The artifact boundary (unchanged mechanics, corrected payer)

- **Borrower export** — watermarked ("FOR INFORMATIONAL PURPOSES"), free
  forever, share anywhere.
- **Institutional export** — clean, "FURLONG institutional export" footer,
  advisory disclosures intact — generated under the paid tiers, which map to
  institutional subscription access, not borrower checkout.

## What Stuart validates (staging; tier preview is unlocked)

1. **Institutional packaging quality** — export the Institutional
   Coordination Report (tier switch shows "Testing unlock", export is clean).
   Is this what a lender actually wants across the desk? What's missing before
   he'd put his name near it?
2. **The subscription frame** — Vol 0 prices platform access by participant
   scale and program volume. Does that structure fit how the lenders he knows
   actually buy? What would a Five Borough-sized shop expect to pay for seat
   + export access?
3. **The governance-fee stream** — per-workflow governance fees (origination
   events, eligibility documentation) — real-world palatable, or does it read
   as a junk fee to an institution?
4. **The handoff moment** — walk the borrower flow to the point where a file
   would move to an institution. Is the moment the clean export unlocks the
   right moment, and is the free brief generous enough to get borrowers there?

Institutional price POINTS (dollar amounts) remain founder-gated for the
founders + counsel session — the Volumes fix the structure, not the numbers.
