# Furlong Commercial Finance Expansion — Steps 2–5

**Status date:** 2026-09-04  
**Owner/operator:** Caitlin Hudson  
**Implementation branch:** `build/commercial-finance-steps-2-5-20260904`

## Governing posture

This build implements the owner-controlled commercial-finance pivot without pretending that Furlong has licenses or lender approvals it does not yet hold. Furlong Core remains the coordination, readiness, evidence, and lender-routing platform. The retained external broker workspace stays available only for legacy or explicitly assigned cases and is not the automatic destination for new financing intakes.

Master Volume authority used for this build: CONST-PATHWAY-001, CONST-FAIR-001, CONST-ARCH-001; REG-STATE-001, REG-LICENSE-001, REG-ECOA-001; TECH-RULES-001, TECH-API-001, TECH-LEDGER-001; OPS-LENDER-001, OPS-LICENSE-001, OPS-REGCHANGE-001; CANON-CONSENT-001, CANON-TREASURY-001, CANON-OBS-001.

## Step 2 — Furlong Capital Desk

**Implemented now:** new financing intakes route first to `furlong-capital-desk`. Intake, program navigation, document readiness, and initial evidence organization remain coordination-only. Secure upload remains inside Furlong custody. No lender or external broker receives a new case merely because the intake was submitted.

**Paid services:** compensated packaging, brokerage/referral, or consulting remain fail-closed until the applicable state/program authority is cleared, an accepted written engagement exists, and compensation is disclosed in advance. For SBA 7(a)/504 compensated Agent activity, the runtime carries an SBA Form 159 control.

**Residential boundary:** the commercial-finance workflow does not activate residential mortgage brokerage/origination authority.

## Step 3 — Diversified lender network

The first candidate registry is seeded with multiple institution types and jurisdictions. Every entry begins as `OUTREACH_PENDING`; none is a live partner and none can receive borrower data until Furlong partner certification, institution/recipient verification, written participation terms, borrower consent, and the existing lender-submission production gates are complete.

Initial discovery candidates:

| Institution | Candidate role | Geography | Current Furlong status |
|---|---|---|---|
| Horizon Farm Credit | Farm Credit / agricultural lending candidate; public materials describe FSA collaboration | DE, MD and broader Mid-Atlantic service area | OUTREACH_PENDING |
| Delaware Community Development Corporation | SBA-certified 504 CDC | DE | OUTREACH_PENDING |
| True Access Capital Corporation | SBA-certified 504 CDC | DE | OUTREACH_PENDING |
| 504 Capital Corporation | SBA-certified 504 CDC | MD (also NC, VA) | OUTREACH_PENDING |

The registry is deliberately candidate-only. No paid placement, preferred routing, or false partnership label is permitted.

## Step 4 — Separate lending affiliate

The lending affiliate is intentionally recorded as `NOT_FORMED`, `NONE` lending authority, and `NONE_VERIFIED` state licenses. The platform will not represent the affiliate as a lender until evidence exists for each production gate.

Required gates include: separate formation and EIN; capitalization and source of funds; state licensing/exemption analysis; credit/underwriting policy; servicing/workout capability; KYC/KYB/OFAC/fair-lending/privacy controls; liquidity/funding plan; loss-reserve/accounting/audit controls; and a hard Core-versus-affiliate conflict/data boundary.

The affiliate will be one financing spoke. It may not receive favorable ranking because of common ownership.

## Step 5 — Federal lender approval roadmap

### SBA 504 — near-term partner route

Use SBA-certified CDCs and qualified senior/third-party lenders now. The direct-lender affiliate does not need to wait to begin building relationships and understanding the 504 flow. Refresh all workflow rules against SOP 50 10 version 8.1 before its 2026-10-01 effective date.

### FSA Guaranteed Farm Loans — build operating capability

Use existing agricultural/FSA-capable lenders as partners now. A future affiliate must qualify under an appropriate FSA lender category. FSA currently describes four lender programs: Micro Lender, Standard Eligible, Certified, and Preferred. The applicable route depends on regulatory status and agricultural/FSA lending experience.

### USDA OneRD — three-year evidence clock

For a non-regulated lending entity, 7 CFR 5001.130 requires legal lending authority and a successful commercial-lending history, including at least five commercial loans totaling at least $1 million in each of the prior three years, together with financial-soundness, equity, liquidity/credit-line, reserve, policy, management, audited-financial, and servicing evidence. The affiliate therefore cannot apply today; the build makes the eventual evidence requirements explicit from the first loan onward.

### SBA 7(a) — long-term direct-lender route

Use participating 7(a) lenders as network partners while the affiliate builds capital, staff, lending history, servicing capacity, and compliance infrastructure. Direct SBA lender participation is a later application decision, not an authority currently held by Furlong. SOP 50 10 version 8.1 becomes effective 2026-10-01 and must be the production rule baseline after that date.

## Current regulatory source snapshot

- Delaware Code, Title 5 Chapter 21 (mortgage loan brokers; owner-occupied 1–4 family personal/family/household scope): https://delcode.delaware.gov/title5/c021/index.html
- Delaware Code, Title 5 Chapter 22 §2202 (licensed-lender rule): https://delcode.delaware.gov/title5/c022/sc01/index.html
- Delaware Office of the State Bank Commissioner licensing help: https://banking.delaware.gov/faqs/licensing-help/
- SBA SOP 50 10 lender/development company program page (v8.1 effective 2026-10-01): https://www.sba.gov/document/sop-50-10-lender-development-company-loan-programs
- SBA 504 CDC list: https://www.sba.gov/loans/504-loans/list-of-certified-development-companies/
- FSA Guaranteed Loan Lender Toolkit: https://www.fsa.usda.gov/resources/programs/guaranteed-farm-loans/lender-toolkit
- FSA Guaranteed Farm Loans: https://www.fsa.usda.gov/resources/loans/guaranteed-farm-loans
- USDA OneRD lender eligibility: 7 CFR 5001.130, https://www.ecfr.gov/current/title-7/section-5001.130

## Hard blocks that remain truthful

1. No paid Furlong commercial brokerage/referral activity until jurisdiction-specific legal/licensing clearance is recorded.
2. No candidate lender receives borrower data until partner and recipient certification plus exact borrower consent are complete.
3. No live lender-delivery adapter is activated by this build; existing lender-submission live promotion remains separately gated.
4. No lending affiliate is represented as formed, licensed, capitalized, or authorized until external legal/corporate/regulatory evidence exists.
5. No SBA, USDA OneRD, or FSA lender approval is claimed before the responsible agency actually grants it.
