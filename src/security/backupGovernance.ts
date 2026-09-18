/**
 * IMMUTABLE-BACKUP-001 — Backup governance (governance only; no live backups).
 *
 * Defines the four backup tiers, the per-backup record contract, and the
 * production blocker: production cannot pass until at least one Tier C immutable
 * backup is VERIFIED and restore-tested. Honest by default — every seeded record
 * is "pending", so `immutableBackupVerified()` is false until a human attests a
 * real, verified immutable backup with a passing restore test.
 *
 * Master Volume traceability: Vol III (Infrastructure persistence), Vol IV
 * (recovery runbooks), TECH-REPLAY-001 (restores must be reconstructable).
 */

export const IMMUTABLE_BACKUP_DOCTRINE_ID = "IMMUTABLE-BACKUP-001";
export const IMMUTABLE_BACKUP_VERSION = "backup-governance-v0.1.0";

export type BackupTier = "A" | "B" | "C" | "D";
export const BACKUP_TIERS: Record<BackupTier, { name: string; purpose: string }> = {
  A: { name: "Tier A — Live Production", purpose: "Primary live data; first to fail in an incident." },
  B: { name: "Tier B — Nearline Recovery", purpose: "Fast restore copy (e.g. PITR / warm snapshot)." },
  C: { name: "Tier C — Immutable Recovery Vault", purpose: "Write-once, object-locked, ransomware-resistant. The recovery floor." },
  D: { name: "Tier D — Offline Archive", purpose: "Air-gapped / cold long-term retention." },
};

export type RetentionClass = "ephemeral" | "30-day" | "90-day" | "1-year" | "7-year" | "legal-hold";
export type VerificationStatus = "pending" | "verified" | "failed";

export interface BackupRecord {
  backup_id: string;
  backup_type: BackupTier;
  created_at: string | null;
  retention_class: RetentionClass;
  /** ISO date through which the backup is immutable (object-lock). Null = not immutable. */
  immutable_until: string | null;
  encrypted: boolean;
  verification_status: VerificationStatus;
  /** Last successful restore-test date (a backup you can't restore isn't a backup). */
  restore_test_date: string | null;
  notes: string;
}

/**
 * Seeded registry — PLANNED tiers, all "pending". No real backup is asserted by
 * the build. A human flips verification_status to "verified" with evidence.
 */
export const BACKUP_REGISTRY: BackupRecord[] = [
  { backup_id: "core-db-nearline", backup_type: "B", created_at: null, retention_class: "30-day", immutable_until: null, encrypted: true, verification_status: "pending", restore_test_date: null, notes: "Cloud SQL PITR / warm snapshot (planned; not provisioned)." },
  { backup_id: "core-db-immutable-vault", backup_type: "C", created_at: null, retention_class: "90-day", immutable_until: null, encrypted: true, verification_status: "pending", restore_test_date: null, notes: "Object-locked immutable vault (planned). REQUIRED for production." },
  { backup_id: "ledger-immutable-vault", backup_type: "C", created_at: null, retention_class: "7-year", immutable_until: null, encrypted: true, verification_status: "pending", restore_test_date: null, notes: "Audit/consent/ledger immutable copy (planned)." },
  { backup_id: "offline-archive", backup_type: "D", created_at: null, retention_class: "1-year", immutable_until: null, encrypted: true, verification_status: "pending", restore_test_date: null, notes: "Air-gapped cold archive (planned)." },
];

/** A backup counts as a real recovery floor only if immutable, verified, encrypted, and restore-tested. */
export function isUsableImmutable(b: BackupRecord, now = nowIso()): boolean {
  return (
    b.backup_type === "C" &&
    b.encrypted &&
    b.verification_status === "verified" &&
    !!b.immutable_until && b.immutable_until >= now.slice(0, 10) &&
    !!b.restore_test_date
  );
}

/** PRODUCTION BLOCKER (SEC-BACKUP-001): at least one usable Tier C immutable backup. */
export function immutableBackupVerified(now = nowIso()): boolean {
  return BACKUP_REGISTRY.some((b) => isUsableImmutable(b, now));
}

export function backupGovernanceStatus(now = nowIso()) {
  const byTier = (t: BackupTier) => BACKUP_REGISTRY.filter((b) => b.backup_type === t);
  return {
    doctrine: IMMUTABLE_BACKUP_DOCTRINE_ID,
    tiers: Object.keys(BACKUP_TIERS) as BackupTier[],
    counts: {
      total: BACKUP_REGISTRY.length,
      verified: BACKUP_REGISTRY.filter((b) => b.verification_status === "verified").length,
      pending: BACKUP_REGISTRY.filter((b) => b.verification_status === "pending").length,
      failed: BACKUP_REGISTRY.filter((b) => b.verification_status === "failed").length,
    },
    immutableTierCount: byTier("C").length,
    immutableBackupVerified: immutableBackupVerified(now),
    restoreTested: BACKUP_REGISTRY.filter((b) => !!b.restore_test_date).length,
  };
}

function nowIso(): string {
  // Indirection keeps the value injectable in tests (the engine never calls Date
  // directly in pure paths); here a real timestamp is acceptable for status reads.
  return new Date().toISOString();
}
