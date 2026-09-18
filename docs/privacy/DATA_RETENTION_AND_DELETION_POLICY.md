# Ares Farms / Furlong Data Retention and Deletion Policy

**Policy version:** 1.0  
**Effective / last reviewed:** 2026-08-08  
**Next scheduled review:** 2027-08-08, and sooner on material legal, provider, product, or data-practice change.

## Core rule
Personal and consumer financial data is retained only for an active, disclosed purpose and any documented legal, regulatory, dispute, fraud, or audit hold. Indefinite retention is prohibited.

## Plaid data
Plaid access tokens and Plaid-derived consumer data may be persisted only through the ciphertext-only Plaid secure store. Access tokens are never written to plaintext database columns, logs, browser storage, or audit payloads.

When account permission is withdrawn, a linked account is disconnected, or the financing purpose no longer requires access, Furlong revokes provider access and cryptographically purges the local encrypted records. Expired records are eligible for automated purge unless a documented hold applies.

## Data rights and exceptions
Customers may request access, export, correction, restriction, or deletion. Requests affecting regulated or legally significant records are human-reviewed so deletion does not improperly destroy a record that must lawfully be retained. Immutable audit evidence is minimized to non-secret process facts and hashes rather than underlying consumer content.
