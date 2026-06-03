/**
 * CANONICAL READ GUARD
 * This enforces ONE rule:
 *
 * ❌ No raw audit_events access outside replay engine
 */

export function assertCanonicalRead() {
  throw new Error(
    "LEGACY_LEDGER_ACCESS_BLOCKED: use replayCanonicalLedger() only"
  );
}
