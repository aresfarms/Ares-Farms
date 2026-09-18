# Public Report Payment, Refund, and Dispute Readiness

Status date: 2026-09-16  
Owner: Furlong operator  
Doctrine: Vol I CONST-CONSENT-001; Vol III TECH-LEDGER-001 and
TECH-UX-001; Vol III-B runtime enforcement; Vol V CANON-CONSENT-001 and
CANON-TREASURY-001; 2026-09-16 Public Report Commerce amendment.

## Current fail-closed posture

The checked-in staging configuration intentionally has:

- `stripe_payments_enabled = true`
- `stripe_webhook_enabled = false`
- `public_property_report_sales_enabled = false`
- `public_property_report_artifact_delivery_enabled = false`
- `public_property_report_max_open_orders = 0`
- `public_decision_report_sales_enabled = false`
- `public_decision_report_delivery_business_days = 0`
- `public_decision_report_max_open_orders = 0`

Neither paid product is for sale. This is desired source configuration, not proof
of the currently deployed Cloud Run revision. Recheck cloud state after Google
authentication is renewed. Do not deploy or enable a flag merely because this
runbook exists.

## Product boundaries

The two paid report products activate independently:

| Product                          |       Proposed price | Fulfillment    | Additional hard gate                                                           |
| -------------------------------- | -------------------: | -------------- | ------------------------------------------------------------------------------ |
| Furlong Property Report          |             $49 once | Automated      | Frozen report artifact must exist and pass digest verification before checkout |
| Furlong Property Decision Report | $249 base scope once | Human reviewed | Definite delivery window and positive supervised capacity                      |

The checkout route returns `AUTOMATED_ARTIFACT_NOT_READY` before taking payment
unless the Property Report target contains a server-verified reference, SHA-256
digest, and generation time. Customer-supplied artifact claims are not accepted.
That gate must stay in place until the artifact worker and immutable delivery
path are complete.

The Decision Report does not include Phase I, II, or III work, remediation,
site supervision, sampling, laboratory work, stamped drawings, or other
professional field scope. Those services use the separate no-charge scoping
intake and receive an individual written quote and schedule.

## Common release prerequisites

1. Deploy the release candidate with both sales flags false.
2. Apply migrations `0064_furlong_public_orders.sql` and
   `0065_public_order_upgrade_credit.sql`; verify constraints and event trigger.
3. Enable the dedicated signed Stripe webhook ingress and all required events.
4. Record an approved price review for each exact product and catalog version.
5. Prove checkout, failure, refund, dispute, fulfillment, delivery, entitlement,
   and replay behavior with retained test-mode evidence.
6. Confirm the customer sees exact included scope, excluded scope, delivery
   promise, list price, credit, and final amount before accepting.
7. Complete legal review of the purchase/refund language and disclaimers.
8. Confirm paid access is not exposed through preview mode or an unearned grant.
9. Confirm no SSN, personal bank balance, or borrower underwriting data is
   requested by either property-report checkout.
10. Activate only the product whose complete evidence matrix has passed.

## Property Report prerequisites

- Build the automated report from the same versioned evidence shown at checkout.
- Store the final artifact immutably with reference, digest, schema/catalog
  versions, source lineage, assumptions, and generation timestamp.
- Bind the purchased order and entitlement to that exact artifact.
- Deliver the artifact only after a valid signed payment event.
- Prove the customer can retrieve the paid artifact and cannot retrieve another
  customer's artifact.
- Prove a failed, refunded, or disputed payment revokes access.
- Prove artifact-generation failure takes no payment or produces a prompt
  correction/refund path.
- Keep `public_property_report_artifact_delivery_enabled = false` until all
  of the above are demonstrated.

## Decision Report prerequisites

- Choose a supportable 1–30 business-day delivery promise.
- Choose a serialized maximum open-order capacity.
- Prove operator start, completion, and correction/refund controls.
- Upload the final PDF directly from the verified operator browser to the
  IAM-private document bucket; raw PDF bytes must not enter the upload API.
- Verify the stored byte count, SHA-256 digest, malware verdict, and PDF
  structural safety before the order can be completed.
- Bind the verified artifact and at least one evidence reference to the order;
  completion must atomically make that exact artifact customer-available.
- Prove order-token or owning-session download without exposing the private
  object key, and retain every download as an immutable order event.
- Prove refunds and disputes immediately block the download route.

## Required Stripe endpoint events

The test and live endpoints must deliver these events to
`/api/stripe/webhook`:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `charge.succeeded`
- `charge.refunded`
- `refund.failed`
- `charge.dispute.created`
- `charge.dispute.closed`

Historical staging evidence does not include every event above. Public sales
remain closed until event selection and signed reconciliation are re-proven.

## Test-mode evidence matrix

| Scenario                     | Required result                                               |
| ---------------------------- | ------------------------------------------------------------- |
| Successful payment           | Signed event sets `FULFILLMENT_PENDING`; scoped grant created |
| Price/currency mismatch      | Order held; no grant                                          |
| Duplicate webhook            | One effect; no duplicate grant                                |
| Capacity available/full      | One atomic reservation or HTTP 409 before payment             |
| Concurrent final slot        | Exactly one reservation succeeds                              |
| Automated artifact absent    | HTTP 409 `AUTOMATED_ARTIFACT_NOT_READY`; no payment           |
| Automated artifact delivered | Purchased digest equals retrievable artifact digest           |
| Unauthorized artifact read   | Access denied without leaking target or buyer data            |
| Start Decision Report        | Operator event sets `IN_FULFILLMENT` and start time           |
| Cancel before start          | Atomic `REFUND_PENDING`; full paid amount submitted           |
| Duplicate cancellation       | Same Stripe idempotency key; no second refund                 |
| Start/cancel race            | Exactly one transition wins                                   |
| Refund success/failure       | `REFUNDED` and revoked, or `HELD` for review                  |
| Cancel after start           | HTTP 409; no automatic refund                                 |
| Complete report              | Verified artifact plus evidence required; exact PDF published  |
| Customer report download     | Order-token access only; digest header and event retained       |
| Other-order artifact request | Access denied without leaking object key or customer details    |
| Refunded/disputed download   | Access denied before any report bytes are returned               |
| Dispute created              | `DISPUTED`; access revoked immediately                        |
| Dispute closed               | Outcome retained; access stays revoked                        |

For every scenario retain Stripe event ID, Furlong order ID, event digest, trace
ID, order state, grant state, artifact/report digest when applicable, and
screenshots of the customer and operator results. Never retain card data.

## Upgrade-credit acceptance matrix

The $49 Property Report may be credited once toward the $249 base Decision
Report for the same property when requested within 30 days.

| Scenario                                | Required result                                                           |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Eligible same-property upgrade          | $49 credit; $200 final charge                                             |
| Different property                      | No credit and no ambiguous fallback charge                                |
| Source older than 30 days               | No credit                                                                 |
| Source not fulfilled or not fully paid  | No credit                                                                 |
| Refunded or disputed source             | No credit                                                                 |
| Reused source order                     | Second credit rejected atomically                                         |
| Invalid/missing access token            | No source details leaked; credit rejected                                 |
| Concurrent credit attempts              | Exactly one may reserve the source                                        |
| Failed or expired target checkout       | Unpaid credit reservation released for one later use                      |
| Target fully refunded before processing | Source credit released; refunded order retains historical credit evidence |
| Source later refunded or disputed       | Credited target held; grant revoked; late payment and fulfillment blocked |

The agreement, Stripe metadata, order ledger, receipt/status page, refund, and
dispute evidence must all show list price, credit, and paid total consistently.

## Professional-services separation

The public professional-services intake is a request to scope work only. It
takes no payment and promises no universal completion time. It may cover
environmental phases, remediation or site supervision, environmental/civil/
chemical/nuclear/general engineering advice, professional-firm referral, or
custom-concept review. Furlong does not stamp drawings and does not consult on
structural or electrical plans. A separate quote and written scope are required.

## Activation sequence

1. Build and scan the exact image digest.
2. Deploy a no-traffic/test revision with both sales flags false.
3. Run migrations and schema verification.
4. Connect the Stripe test endpoint and execute the common matrix.
5. Execute the complete product-specific matrix.
6. Verify price review, customer copy, refund language, and entitlement.
7. Promote the exact tested revision with both sales flags still false.
8. Enable only the proven product's required capacity/delivery variables and
   sales flag through Terraform.
9. Run one controlled live low-value purchase and prompt refund before general
   promotion; retain the evidence.
10. Independently repeat this sequence before activating the other product.

## Emergency stop

Set the affected product's sales flag to false and deploy the resulting
configuration. For the automated report, also set artifact delivery false if
artifact integrity is uncertain. Do not delete orders, events, grants, reports,
refunds, disputes, or evidence. Signed webhook reconciliation must continue
while new checkout is closed.
