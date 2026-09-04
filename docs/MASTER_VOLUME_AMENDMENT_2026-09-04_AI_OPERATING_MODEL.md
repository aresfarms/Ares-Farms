# MASTER VOLUME AMENDMENT — AI-GUIDED PROPERTY OPERATING MODEL

**Date:** 2026-09-04
**Status:** IMPLEMENTED SCREENING / ADVISORY LAYER
**Doctrine ID:** PROPERTY-AI-OPERATING-MODEL-001

## Constitutional purpose

Furlong must move a customer from "could this property do something better?" to a testable operating case and then toward an executable transaction. For room/unit-based commercial uses, especially hospitality, extended-stay, senior independent living and care-oriented conversions, a generic square-foot rent assumption is not sufficient.

The customer may therefore enter the operating facts they know. Furlong calculates the financial case deterministically and lets AI explain, challenge and improve the assumptions. AI does not replace the calculator, invent inputs, determine eligibility, approve credit, select a lender for compensation, or promise closing.

## Customer workflow

1. Start from the verified property classification, current use, best-supported use and secondary opportunity.
2. Open **Model this use with your own numbers + AI review**.
3. Enter rooms/units, occupancy, ADR or monthly unit revenue, ancillary income, expenses, acquisition/conversion costs and proposed debt terms.
4. Deterministic runtime computes revenue, NOI, operating margin, debt service, DSCR, break-even occupancy, capital/equity need, maximum property-side loan supported at the chosen DSCR target and sensitivity cases.
5. AI receives those calculated outputs as evidence. It may explain the result, identify weak assumptions, ask follow-up questions and propose diligence/execution steps. It may not recalculate or replace the authoritative math.
6. The improved case flows conceptually into entitlement/environmental/conversion diligence, Capital Readiness, USDA/FSA/SBA/conventional pathway comparison, Capital Network matching, borrower-selected lender delivery, underwriting/conditions and closing.

## Credit and borrower-obstacle doctrine

Credit is a financing variable, not a moral score and not a Furlong punishment mechanism. Furlong must not auto-reject a customer merely because they identify credit as a concern. It may help identify what can strengthen a real lender file: repayment/cash-flow support, lower project cost, additional lawful equity, collateral, reserves, experience, complete documentation, explanations for isolated derogatory events, seller-supported structure, guarantor/co-borrower structure where lawful, or a different program/lender credit box.

This does **not** mean credit is irrelevant. Many programs and lenders consider credit history, guarantees, repayment ability, collateral, equity and program-specific eligibility. Only the actual lender/program authority makes the credit or approval decision.

## From answer to keys

Furlong's intended outcome is not merely "we found a lender." The governed execution chain is:

`property -> current use -> best-supported use -> alternative use -> entitlement runway -> environmental -> conversion cost -> operating economics -> DSCR -> USDA/FSA/SBA/conventional comparison -> borrower-readiness obstacles -> lender fit -> borrower selection/consent -> package -> underwriting conditions -> closing readiness -> closing/keys`

Furlong may expose add-on services that help the customer cure missing information or execution blockers, but must distinguish analysis, professional services, lender decisions and government approvals.

## Security and privacy

The anonymous operating-model endpoint is no-store and does not persist customer-entered assumptions. Free-text customer goals pass through the public input guard. AI context passes through the existing REALITY-SEC-001 context firewall. Structured-output validation rejects approval/guarantee/credit-irrelevance claims and falls back to deterministic advice if the AI is unavailable or unsafe.

The production AI execution boundary remains subject to the platform AI/bot security plan and launch gates. This amendment does not weaken any bot, cost-abuse, data-egress, model-isolation or red-team requirement.

## Standing proof

- `npm run verify:property-operating-model`
- `npm run verify:property-intelligence-expansion`
- `npm run verify:property-report-copy-integrity`
- `npm run verify:master-volumes`
- `npx tsc --noEmit`
- `npm run build`
