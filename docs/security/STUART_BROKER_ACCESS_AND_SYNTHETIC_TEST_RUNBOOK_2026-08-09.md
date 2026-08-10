# Stuart Broker Access and Synthetic Test Runbook — 2026-08-09

## Scope

This runbook governs Stuart Fraass's staging access to the Compass to Capital lender desk and the synthetic broker records used to verify that module before live reliance.

## Access boundary

- Google IAP admits `sfraas@aresfarmsinc.com` to the staging perimeter.
- Furlong credentials establish the application session.
- Windows Hello supplies phishing-resistant passkey MFA in Edge or Chrome.
- Stuart's operator-registry capability `operate:lender-desk` grants the lender-desk role in non-production environments only.
- Production ignores that staging bridge and requires current verified professional authority.
- Stuart's capability does not grant governance-console, audit-console, or unrelated professional-lane access.

## Synthetic fixtures

The visible names are clues; immutable lineage is the authority. Every durable synthetic artifact records the persona ID, run ID, fixture version, environment, operator identity, creation time, scenario, record binding, and deterministic lineage hash.

| Persona          | Governed purpose                                                             |
| ---------------- | ---------------------------------------------------------------------------- |
| Pocohantus Smith | Professional-role access and least-privilege tests                           |
| Tree Frog        | Broker intake, pro forma, document, signature, and sandbox-delivery tests    |
| Tuna Fish        | Plaid Sandbox, Stripe test card, Apple Pay, Google Pay, and allocation tests |
| Purple Cow       | Fraud hold, ownership mismatch, recovery, and negative-control tests         |
| Rainbow Trout    | Positive full lender-lifecycle and reconciliation tests                      |

Legacy broker fixtures—Sam Oranutang, Sammy Snake, Frank Furter, Hound Dog, Shark Bait, and the historical founder smoke record—are backfill-only and cannot be activated for new runs.

## External-action controls

- Synthetic records never send real document reminders, upload notices, or signature-request emails.
- Lender delivery is limited to the sandbox adapter.
- Plaid is limited to Sandbox.
- Stripe card and wallet scenarios are limited to test mode.
- Stripe-hosted Checkout uses Dashboard-managed dynamic payment methods; Apple Pay and Google Pay are enabled in Stripe, not as Google Cloud APIs.
- A Stripe webhook must prove the observed method matches the selected scenario: card, Apple Pay, or Google Pay. Mismatches block closure.
- Apple Pay is exercised on Caitlin's Mac in Safari; Google Pay may be exercised in Chrome or Edge, including Stuart's Windows device.
- Synthetic activation never approves the pro forma or authorizes a live lender dispatch.

## Verification commands

- `npm run verify:synthetic-fixture-lineage`
- `npm run verify:lender-desk-steward-access`
- `npm run verify:lender-delivery-conformance`
- `npm run verify:plaid-link-security`
- `npm run verify:payment-fraud`
- `npm run verify:stripe-connect-allocation`
- `npm run audit:broker-synthetic-and-stuart-access:strict`

## Staging sequence

1. Apply migration `0053_synthetic_fixture_lineage.sql` through the dedicated migrator.
2. Run the broker-fixture backfill in plan mode.
3. Review the exact records and deterministic lineage bindings.
4. Execute the founder-authorized backfill.
5. Run the strict broker/Stuart access audit.
6. Deploy the current digest-pinned core image with staging synthetic-fixture controls enabled.
7. Stuart completes Google access, Farm Login, and Windows Hello passkey verification.
8. Caitlin activates each fixture and runs the corresponding browser/provider workflow.
9. Stuart reviews or approves the existing pro forma before the lender-lifecycle fixture proceeds to sandbox dispatch.

Production remains blocked until the independent professional, security, vendor, DNS, recovery, and production-authority gates are satisfied.
