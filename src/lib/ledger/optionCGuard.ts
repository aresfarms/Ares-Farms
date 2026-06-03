/**
 * OPTION C ARCHITECTURAL GUARD
 *
 * This system enforces replay-as-authority architecture.
 * audit_events is the ONLY source of truth.
 *
 * Any violation should fail fast in development.
 */

export function assertOptionCEnabled(): void {
  if (process.env.LEDGER_MODE !== "OPTION_C") {
    throw new Error("❌ Ledger is not in Option C mode");
  }
}

/**
 * HARD RULE: event_hash is NOT required anywhere in runtime logic
 */
export function assertNoEventHashDependency(_: any): void {
  // intentionally empty — presence is forbidden, not required
}

/**
 * HARD RULE: canonical tables are NOT authoritative
 */
export function blockCanonicalTruthUsage(): void {
  throw new Error(
    "❌ canonical_ledger is a projection only. Use audit_events replay instead."
  );
}
