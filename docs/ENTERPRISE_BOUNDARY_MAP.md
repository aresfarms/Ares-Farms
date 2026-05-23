# Ares Farms Enterprise Boundary Map

## Zone 1 — Public Web Layer
Purpose:
- frontend rendering
- dashboards
- onboarding UI

Allowed Access:
- API Edge only

Forbidden:
- direct database access
- audit writes
- secret access

---

## Zone 2 — API Edge Layer
Purpose:
- request validation
- schema enforcement
- rate limiting
- auth enforcement

Allowed Access:
- Pipeline Core
- Identity Layer

Forbidden:
- direct ledger modification
- direct financial writes

---

## Zone 3 — Pipeline Core
Purpose:
- scoring
- recommendation engine
- decisioning

Allowed Access:
- Audit Ledger Append API

Forbidden:
- audit mutation
- direct auth management

---

## Zone 4 — Audit Ledger Core
Purpose:
- immutable append-only event storage

Rules:
- append only
- no update/delete
- chain enforced
- isolated from frontend

---

## Zone 5 — Payment Layer
Purpose:
- Stripe checkout
- webhook processing
- entitlement activation

Forbidden:
- pipeline modification
- audit mutation

---

## Zone 6 — Report Layer
Purpose:
- PDF generation
- export generation

Forbidden:
- ledger mutation
- payment control

---

## Zone 7 — Identity Layer
Purpose:
- authentication
- session management
- RBAC

---

## Zone 8 — Admin Layer
Purpose:
- internal operations only

Requirements:
- MFA later
- audit logging mandatory

---

## Zone 9 — Future Connector Layer
Purpose:
- banks
- regulators
- USDA
- insurance
- GIS providers

Requirements:
- isolated service boundaries
- scoped credentials
- zero trust communication
