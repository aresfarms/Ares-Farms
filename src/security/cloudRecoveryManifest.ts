/**
 * CLOUD-RECOVERY-001 — Cloud rebuild manifest (governance only; documentation).
 *
 * The ordered, dependency-aware plan to rebuild the institution from total loss:
 * cloud account lost, database destroyed, secrets compromised, DNS hijacked, and
 * CI/CD compromised — all at once. Each step names its dependencies, the recovery
 * authority required, and the verification that proves it succeeded. This is a
 * PLAN, not an executor — nothing here performs an action.
 *
 * Master Volume traceability: Vol IV (recovery runbooks), Vol III (infra),
 * Vol II (founder recovery authority).
 */

export const CLOUD_RECOVERY_DOCTRINE_ID = "CLOUD-RECOVERY-001";
export const CLOUD_RECOVERY_VERSION = "cloud-recovery-manifest-v0.1.0";

/** The simultaneous worst-case this manifest assumes. */
export const ASSUMED_LOSS = [
  "cloud-account-lost",
  "database-destroyed",
  "secrets-compromised",
  "dns-hijacked",
  "cicd-compromised",
] as const;

export type RecoveryAuthority = "all-founders" | "two-founders" | "operator-under-supervision";

export interface RebuildStep {
  id: string;
  title: string;
  /** Step ids that must complete first. */
  depends_on: string[];
  recovery_authority: RecoveryAuthority;
  verification: string;
}

/**
 * The rebuild order. Authority escalates for the irreversible/identity-critical
 * steps (account + DNS + secrets) to ALL founders; later app steps need two.
 */
export const REBUILD_ORDER: RebuildStep[] = [
  { id: "01-establish-clean-identity", title: "Re-establish a clean cloud org + founder identities under multi-party control", depends_on: [], recovery_authority: "all-founders", verification: "New org owned by all founders; old credentials revoked; MFA/passkeys enforced." },
  { id: "02-regain-dns-control", title: "Regain registrar + DNS authority (lock, transfer-lock, MFA)", depends_on: ["01-establish-clean-identity"], recovery_authority: "all-founders", verification: "Registrar account recovered; transfer/registrar lock on; nameservers verified (DNS-GOV-001)." },
  { id: "03-rotate-all-secrets", title: "Mint brand-new secrets in a fresh vault; invalidate all prior secrets", depends_on: ["01-establish-clean-identity"], recovery_authority: "all-founders", verification: "All SECRET-GOV-001 secrets reissued + vault-backed; no old secret valid." },
  { id: "04-restore-immutable-backups", title: "Restore core DB + ledgers from the Tier C immutable vault", depends_on: ["01-establish-clean-identity", "03-rotate-all-secrets"], recovery_authority: "two-founders", verification: "Restore from IMMUTABLE-BACKUP-001 Tier C; ledger hash-chains verify (TECH-LEDGER-001)." },
  { id: "05-rebuild-cicd", title: "Rebuild CI/CD from source with new signing identities", depends_on: ["01-establish-clean-identity", "03-rotate-all-secrets"], recovery_authority: "two-founders", verification: "Fresh deploy identity; pipeline reproduces a signed build from clean source." },
  { id: "06-redeploy-app", title: "Redeploy the application (no public PII flows enabled)", depends_on: ["04-restore-immutable-backups", "05-rebuild-cicd"], recovery_authority: "two-founders", verification: "App healthy in private; constitutional constraints intact; public PII still gated." },
  { id: "07-revalidate", title: "Revalidate integrity + run a recovery certification before any cutover", depends_on: ["06-redeploy-app", "02-regain-dns-control"], recovery_authority: "all-founders", verification: "RECOVERY-CERT-001 passes; SECURITY-DR-001 REVALIDATION → RETURN_TO_SERVICE; human approval." },
];

/** Verify the order is a valid topological sequence (no step before its deps). */
export function rebuildOrderValid(): { ok: boolean; findings: string[] } {
  const findings: string[] = [];
  const seen = new Set<string>();
  for (const step of REBUILD_ORDER) {
    for (const dep of step.depends_on) {
      if (!seen.has(dep)) findings.push(`${step.id} depends on ${dep}, which has not appeared earlier in the order`);
    }
    seen.add(step.id);
  }
  // Every assumed loss must be addressed by some step's title/verification.
  const LOSS_KEYWORDS: Record<(typeof ASSUMED_LOSS)[number], string[]> = {
    "cloud-account-lost": ["org", "identity", "account"],
    "database-destroyed": ["db", "database", "restore"],
    "secrets-compromised": ["secret", "vault"],
    "dns-hijacked": ["dns", "registrar"],
    "cicd-compromised": ["ci/cd", "cicd", "pipeline"],
  };
  for (const loss of ASSUMED_LOSS) {
    const hay = REBUILD_ORDER.map((s) => (s.title + " " + s.verification).toLowerCase()).join("\n");
    if (!LOSS_KEYWORDS[loss].some((k) => hay.includes(k))) {
      findings.push(`no rebuild step addresses loss "${loss}"`);
    }
  }
  return { ok: findings.length === 0, findings };
}

export function cloudRecoveryStatus() {
  const v = rebuildOrderValid();
  return {
    doctrine: CLOUD_RECOVERY_DOCTRINE_ID,
    assumedLoss: ASSUMED_LOSS,
    steps: REBUILD_ORDER.length,
    orderValid: v.ok,
    findings: v.findings,
    documented: true,
  };
}
