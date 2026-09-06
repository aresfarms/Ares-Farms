# OPS-STRIPE-CONNECT-ALLOCATION-001

## Pre-live checklist
- Create Stripe Connected Account for Caitlin's approved receiving entity/account.
- Complete Stripe onboarding and payout-bank verification for each currently authorized recipient.
- Record Connected Account IDs in governed environment configuration.
- Certify recipient ownership, tax/entity posture, refund/dispute handling, and payout controls.
- Approve versioned revenue-class allocation rules before enabling transfers.
- Verify webhook signature handling, payment-to-source-transaction binding, transfer reconciliation, reversals, and ledger replay.
- Keep transfer promotion inactive until human approval is recorded.

## Incident rule
If recipient certification, payment provenance, rule approval, or reconciliation is uncertain, do not transfer. Retain funds at the Furlong platform balance and send the item to human review.

## General-fund operating sequence
1. Classify revenue before any transfer calculation.
2. Apply only current, versioned provider-allocation rules supported by a written agreement and certified payout destination; absent such a rule, retain the funds in Furlong.
3. Route all otherwise unallocated current revenue to the general-fund waterfall.
4. Deduct processor costs, taxes, refunds/chargebacks, and necessary operating expenses.
5. Calculate current owner/platform stewardship, approved operating reimbursements, reserves, and any documented build-recovery obligations under current corporate approvals.
6. Reimburse documented authorized cash advances.
7. Apply any approved build-recovery priority, capped by the outstanding approved recovery balance.
8. Retain remaining distributable funds in Furlong unless a current corporate distribution authorization directs otherwise.
9. Persist the allocation evidence and hash before creating any Stripe transfer.
10. Block live transfer if a connected account, certification, source transaction, or promotion authority is absent.
