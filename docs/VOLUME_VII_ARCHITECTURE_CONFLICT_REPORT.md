# Volume VII architecture freeze and conflict report

Date: 2026-08-06
Branch: `build-volume-vii-execution-001`
Authority: `FURLONG-VOL-VII-EXTACTION-EXEC-MASTER` v1.0

## Canonical paths to extend

| Concern | Existing authority | Volume VII decision |
|---|---|---|
| Schema | `src/db/schema/` with exports only from `src/db/schema/index.ts` | Add one schema module and one migration; no alternate ORM or schema barrel. |
| Migrations | `src/lib/db/migrations/` | Add the next numbered migration after `0045`. |
| Immutable audit | `src/lib/audit/writeAuditEvent.ts` and audit-chain v2 | Every authorization decision and material execution event uses the canonical writer; no console/file ledger. |
| Replay and governance evidence | `src/lib/governance/evidenceStore.ts`, replay registry, module/event registries | Register signature events and persist replay references without signature images or identity documents. |
| Consent | `src/lib/privacy/consentRegistry.ts` and action gate | Extend the versioned registry; execution records bind exact disclosure and document hashes. Do not use the separate anonymous file ledger for identified signing evidence. |
| Identity and RBAC | `src/lib/auth/identity.ts`, session authority, access control | Use authenticated platform identity and separate signer-authority evidence. No live identity provider is introduced in this branch. |
| Human review | canonical review stores and transition controls | Require exact-document/plan reviewer evidence in the execution gate. |
| Documents and storage | `applicationDocuments`, document store, storage handoff, governed GCS helpers, malware scanner | Preserve source bytes; store only content-addressed references and hashes in signature records. |
| PDF | `pdf-lib` dependency plus existing PDFKit generators | Use `pdf-lib` for deterministic source-page preservation and same-file appended execution pages. PDFKit certificate-only output is not canonical execution. |
| Connectors | certified connector adapter framework | Add a provider-neutral signature contract and deterministic offline mock only. |
| Promotion | controlled promotion and live-action gates | Hard-code this build to `LIVE SIGNING BLOCKED`; environment variables or provider credentials cannot activate it. |
| Runtime/API | runtime guard, session authority, observability, API perimeter | Mutations require authenticated scoped actors, idempotency, expected aggregate version, audit context, and domain-owned transitions. |

## Conflicts requiring correction

1. `src/app/api/public/document-sign/route.ts` currently creates a detached certificate, marks the original document `signed`, and sends notifications. It does not produce one executed PDF and therefore must not represent execution.
2. `src/lib/documents/signatureVault.ts` permits `SIGNATURE_MODE=live` to alter legal posture. Volume VII prohibits environment-variable activation.
3. Existing consent text is hardcoded and pre-counsel; presentation, acceptance, withdrawal, and exact-document intent are not immutable database evidence.
4. Status lookup plus typed name does not prove signer capacity or represented-party authority.
5. Quarantine is fail-open when `QUARANTINE_MODE` is off. Signature ingestion must independently require a clean scan result.
6. No canonical signature execution aggregate, placement plan, authority record, execution authorization, provider inbox/outbox, executed-PDF version, validation report, failure, or replay record exists.
7. No PDF analyzer blocks encryption, scripts/actions, embedded files, malformed structures, unsafe forms, or existing signature conflicts.
8. No authored-zone or third-party append-page finalizer exists despite `pdf-lib` being installed.
9. There is no production signing adapter, counsel-approved jurisdiction overlay, identity-verification provider, or provider certification. These remain blockers, not inferred capabilities.

## Frozen implementation boundary

This branch may implement deterministic offline analysis, placement, finalization, validation, mock ceremony evidence, APIs, fixtures, and review surfaces. It may not create a live invitation, contact a provider, send a signing email, apply a production signature, call an external identity service, deploy, migrate a live database, or enable delivery.
