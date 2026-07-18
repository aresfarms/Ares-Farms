# Tier boundary — what Stuart is testing, and the verdict we need

**Status:** built for evaluation only. No payments, no prices, no checkout —
tier economics stay founder-gated per the standing rule (membership economics
decided by founders + counsel, not by the build). This exists so the boundary
can be FELT before it is priced.

## The question

Caitlin's framing (2026-07-18): the free report is generous — so why would
anyone pay? The candidate answer built here:

> **The screen and the watermarked PDF are free — the artifact you take into a
> transaction is the product.**

- **Free tier** — everything on screen, plus the **watermarked** PDF export
  ("FOR INFORMATIONAL PURPOSES · NOT FOR REPRODUCTION" diagonal, "Watermarked
  FURLONG export" footer). Free forever; every shared copy advertises Furlong.
- **Paid tiers** (Institutional Coordination / Environmental Readiness) — the
  same engine, deeper content, and a **clean export**: no diagonal watermark,
  "FURLONG institutional export" footer — the package you hand a lender across
  a desk. The brand seal and every advisory disclosure remain on all tiers.

The theory being tested: people take the free brief, hit the moment they need
to *show someone* (a lender, a partner, an agency), and come back for the
clean package — and for financing coordination through the module itself.

## How to test (staging, IAP allowlist)

1. Run any property analysis (browse a listing or check an address).
2. Export the PDF on the **free tier** — see the watermark and footer.
3. Switch the report tier to **Institutional Coordination** (unlocked on
   staging via `FURLONG_TIER_PREVIEW_MODE` — badge shows "Testing unlock").
4. Export again — same file, clean: no diagonal, institutional footer.
5. Compare the two side by side AS A LENDER WOULD SEE THEM.

## The verdict we need from Stuart

1. Is the watermarked-free / clean-paid line the **right boundary** — would a
   borrower's lender actually care about the difference?
2. Is the free version giving away too much, too little, or exactly enough to
   force the return visit?
3. Does the Institutional Coordination content (ranked lanes, lender question
   set, county pulls) match what an institution actually asks for — what's
   missing before he'd put his name near it?
4. Token-fee vs tier-subscription for the clean export — which fits how these
   customers actually buy?

Economics (prices, what bundles where, hours/credits) stay parked for the
founders + counsel session — this build only makes the boundary testable.
