/**
 * RECOVERY-CERT-001 — Recovery certification (governance only).
 *
 * Tracks the institution's recovery objectives (RPO/RTO), the recovery
 * simulations that prove them, a recovery score, and the certification window.
 * Production is BLOCKED when certification is missing or expired. Default: no
 * valid certification (a human records one after a real, passing recovery sim).
 *
 * Master Volume traceability: Vol IV (recovery runbooks), TECH-REPLAY-001
 * (recovery must be reconstructable + measurable).
 */

export const RECOVERY_CERT_DOCTRINE_ID = "RECOVERY-CERT-001";
export const RECOVERY_CERT_VERSION = "recovery-certification-v0.1.0";

export interface RecoverySimulation {
  sim_id: string;
  scenario: string;
  date: string | null;
  /** Did the simulated recovery succeed within objectives? */
  passed: boolean;
  measured_rpo_minutes: number | null;
  measured_rto_minutes: number | null;
  notes: string;
}

export interface RecoveryCertification {
  /** Target objectives. */
  target_rpo_minutes: number;
  target_rto_minutes: number;
  simulations: RecoverySimulation[];
  /** 0–100 readiness score (from sims + objectives met). */
  recovery_score: number;
  certification_date: string | null;
  expiration: string | null;
  certified_by: string | null;
}

/** Seeded: objectives set, but NO passing sim and NO certification yet. */
export const RECOVERY_CERTIFICATION: RecoveryCertification = {
  target_rpo_minutes: 60,
  target_rto_minutes: 240,
  simulations: [
    { sim_id: "ransomware-restore", scenario: "ransomware", date: null, passed: false, measured_rpo_minutes: null, measured_rto_minutes: null, notes: "Restore core DB from immutable vault (not yet run)." },
    { sim_id: "infra-rebuild", scenario: "infrastructure-destruction", date: null, passed: false, measured_rpo_minutes: null, measured_rto_minutes: null, notes: "Full cloud rebuild drill (not yet run)." },
  ],
  recovery_score: 0,
  certification_date: null,
  expiration: null,
  certified_by: null,
};

export function recoveryCertificationValid(now = new Date().toISOString().slice(0, 10)): boolean {
  const c = RECOVERY_CERTIFICATION;
  if (!c.certification_date || !c.expiration || !c.certified_by) return false; // missing
  if (c.expiration < now) return false; // expired
  // A certification must be backed by at least one passing sim meeting objectives.
  return c.simulations.some((s) => s.passed && (s.measured_rto_minutes ?? Infinity) <= c.target_rto_minutes && (s.measured_rpo_minutes ?? Infinity) <= c.target_rpo_minutes);
}

export function recoveryCertificationStatus(now = new Date().toISOString().slice(0, 10)) {
  const c = RECOVERY_CERTIFICATION;
  const valid = recoveryCertificationValid(now);
  const reason = !c.certification_date ? "missing" : c.expiration && c.expiration < now ? "expired" : valid ? "valid" : "unverified-sims";
  return {
    doctrine: RECOVERY_CERT_DOCTRINE_ID,
    target_rpo_minutes: c.target_rpo_minutes,
    target_rto_minutes: c.target_rto_minutes,
    recovery_score: c.recovery_score,
    certification_date: c.certification_date,
    expiration: c.expiration,
    simulationsPassed: c.simulations.filter((s) => s.passed).length,
    simulationsTotal: c.simulations.length,
    valid,
    reason,
  };
}
