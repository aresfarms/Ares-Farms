# Plaid Secret Access Authorization — 2026-08-08

Authorized by: Caitlin Hudson
Organization: Ares Farms Inc. / Furlong
Authorization stated: August 8, 2026 at 2:03 PM Eastern Time

Authorized principal:
`furlong-core-runtime@furlong-staging-499102.iam.gserviceaccount.com`

Authorized scope:
- Secret Manager accessor on `PLAID_CLIENT_ID` only.
- Secret Manager accessor on `PlaidSecret` only, surfaced to the application as `PLAID_SECRET`.

This authorization does not grant access to unrelated secrets, does not alter the database-migrator authority boundary, and does not authorize plaintext credential persistence or disclosure.
