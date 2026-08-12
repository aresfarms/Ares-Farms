# CANON-SIGNATURE-EXECUTION-001

Status: built for governed offline validation; live signing blocked.

The canonical result of a successful Furlong signature execution is one executed PDF containing the instrument and its execution evidence. A detached certificate, activity log, viewed event, captured mark, delivery event, or acknowledgment is evidence only and never substitutes for the executed instrument.

The exact source bytes are sealed with SHA-256 before authority, disclosure, intent, placement review, authorization, capture, finalization, and validation. Every fact is version-bound to the same source hash and signer capacity. Any false, unknown, stale, conflicting, or unevidenced gate denies execution.

Furlong-authored instruments may use only certified, versioned signature zones. Third-party PDFs preserve all original pages and receive a governed execution page appended inside the same PDF. A margin marker is omitted unless unused space can be proven safely. Existing PDF signatures or certifications block execution absent a separately approved preservation path.

Truth is non-collapsible: viewed does not mean consented; consented does not mean intent; captured does not mean executed; executed does not mean delivered; delivered does not mean acknowledged.

Doctrine source: Furlong Volume VII, version 2026-08-06. Governing build IDs: `TECH-PDF-EXECUTION-001`, `OPS-SIGNATURE-EXECUTION-001`, `BUILD-EXTACTION-EXEC-001`, and `VERIFY-EXTACTION-EXEC-001`.
