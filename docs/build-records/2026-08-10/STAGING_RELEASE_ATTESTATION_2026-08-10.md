# Staging Release Attestation — 2026-08-10 (second release of the day)

Supersedes the digest table in `STAGING_SECURITY_CLOSURE_2026-08-10.md` for the
runtimes below. That document's open release gates are unchanged and none are
closed by this record.

## Approved runtime evidence

| Runtime | Immutable digest | HIGH | CRITICAL | Other findings | On-demand scan |
| --- | --- | ---: | ---: | --- | --- |
| Core/webhook | `sha256:965a9ffe4fe38607fadaf69403de6478742160f15ce8dcee539cfe0bb4c2ae07` | 0 | 0 | 5 LOW, 7 MINIMAL | `13d9296e-c970-48c0-ac0e-6ec3cd173ab4` |
| DB migrator/verifier/refresh | `sha256:68262132daad2f256851d7f06a20d2c3a4ac2f43fdb4045be0537b5c3c50ee5e` | 0 | 0 | 5 LOW, 7 MINIMAL | `2a1a60c9-3790-4e71-9b3f-1de7df23560d` |
| Scanner | `sha256:a8959e43e9c4bb8adbd6e9d39b2a052239b09c4b06eab63773bcb86c5b6deb69` | 0 | 0 | 2 MEDIUM, 24 LOW, 19 MINIMAL | `466fad9b-00f8-4288-8b7a-4805a8c34ae1` |

Scans are Artifact Analysis on-demand (`ondemandscanning.googleapis.com`);
automatic push-scanning is deliberately not enabled, so a release that skips the
scan step produces NO vulnerability evidence rather than a stale pass.

Each digest carries an attestation from `furlong-release-approval`, signed by
KMS key version 1 of `furlong-release-attestor` under
`user:chudson@aresfarmsinc.com` — the sole principal in
`binary_authorization_signer_principals`.

## Source

Commit `5f8da43`. Manifest `2026-08-10T19-03-48-800Z-5f8da43`; gate report
alongside it. Terraform apply: 1 added, 1 changed, 0 destroyed. All 14 P2.4/P3
gates pass.

## Process correction recorded against this release

The first attempt at this release went build → deploy and was BLOCKED by
Binary Authorization, correctly. Two steps had been skipped:

1. the on-demand vulnerability scan, and
2. the founder attestation.

The blocked apply changed nothing; the prior revision continued serving. The
correct order is **build → on-demand scan → confirm zero HIGH/CRITICAL →
founder attestation → apply → gates → record**. A sign command offered without
scan evidence asks the founder to attest to a fact nobody has checked, which is
precisely what the attestor note ("Approved zero-HIGH/CRITICAL Furlong release
digests") exists to prevent.

## What this release contains

55 commits that had accumulated ahead of the previously deployed revision,
including governed signature execution (executed PDF with collision-free
placement), Stuart broker onboarding and testing surfaces, synthetic fixture
lineage separating test personas from customers, dashboard-managed Stripe
wallets, and Plaid Link behind passkey MFA. Plus, from this session: session-
derived API authority across 20 routes, three counterparty lanes closed off
internal consoles, the market-value indication engine, and the Stripe Identity
schema/adapter/route (partial — webhook wiring and UI still open).

## Not closed by this record

Wallets still require real Apple Pay and Google Pay PHYSICAL-DEVICE journeys.
Apple Pay additionally cannot complete domain verification while staging sits
behind IAP: Stripe must fetch `/.well-known/apple-developer-merchantid-domain-
association` over the public internet, and that path returns 302.
