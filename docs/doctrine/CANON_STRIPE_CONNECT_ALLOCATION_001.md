# CANON-STRIPE-CONNECT-ALLOCATION-001

## Status
Founder-approved architecture; transfer execution remains promotion-inactive.

## Canonical rule
Furlong is the platform payment collector. Approved module-provider allocations may be transferred to certified Stripe Connected Accounts for Caitlin and Stuart. Any amount not allocated remains in the Furlong Stripe platform balance.

## Required controls
1. Revenue allocation rules are versioned and immutable once used.
2. Percentages are stored as basis points and may vary by revenue class/module.
3. No allocation rule may exceed 100% of the originating payment.
4. The residual amount is always the Furlong-retained amount.
5. No transfer may execute unless the recipient Connected Account is certified and the originating Stripe source transaction is bound.
6. Stripe is an execution provider, not the source of truth for economic entitlement.
7. The canonical allocation evidence record must exist before any external transfer.
8. Historical payments retain the rule version effective for that payment.
9. Refund, dispute, reversal, tax, and accounting treatment require separate governed reconciliation.
10. Until an approved rule exists, the default is retain-all: 100% stays with Furlong.

## Founder economics overlay
11. Stuart financing-module revenue is 100% Stuart.
12. Caitlin environmental-module revenue is 100% Caitlin.
13. All other current platform revenue enters the Furlong general fund.
14. Frances's future module is economically Frances's; its payout destination may be Stuart's approved connected account when formally authorized.
15. General-fund revenue first absorbs processor costs, taxes, refunds/chargebacks, and necessary current operating expenses.
16. Caitlin's platform stewardship compensation is $4,000/month for up to 20 hours of ordinary maintenance and operations. Founder-approved excess hours are valued at $175/hour.
17. Stewardship cash payment is revenue-sensitive: below $5,000 monthly general-fund revenue it accrues; from $5,000 to below $10,000 cash payment is capped at $2,000/month; at $10,000 or more the $4,000 baseline may be paid, subject to available cash.
18. Documented founder cash expenses advanced by Caitlin are reimbursed dollar-for-dollar before build recovery and general distributions.
19. Approved historical/common-platform build value is recovered through a temporary 15% priority from remaining distributable general-fund cash until the approved recovery balance reaches zero.
20. After priority obligations, remaining distributable general-fund cash is split one-third Caitlin, one-third Stuart, and one-third retained as Furlong reserve, with integer-currency rounding residue retained by Furlong.
21. Environmental-module work paid through the environmental module must not also be added to the common-platform build-recovery ledger.
22. Build-recovery balances and quarterly additions require immutable evidence and founder-approved valuation methodology; prior periods are never rewritten.
