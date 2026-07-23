import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PoolClient } from "pg";

/**
 * Canonical Governance Migration Registry (single source of truth)
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): one authoritative ordered schema lineage.
 * - Vol III (Technical Infrastructure): prevents duplicate migration lists and
 *   the schema drift that competing sources cause.
 * - Vol III-B (Governance Runtime): the same ordered set is applied identically
 *   by the local operator command (`db:migrate:governance`) and by the staging
 *   migrator Job (`migrate:schema`) — one path, local and prod.
 * - Vol IV (Operational Runbooks): supports the controlled migration step and
 *   deterministic rebuild.
 * - Vol V (Canonical Doctrines): preserves replay, versioning, classification,
 *   observability, and audit lineage tables.
 *
 * This module is the ONLY place the canonical governance migration file list is
 * declared. `applyCanonicalGovernanceMigration.ts` (the operator CLI) and
 * `migrateSchema.ts` (the staging schema operation) both consume it, so the two
 * can never drift apart. Every file uses `CREATE TABLE IF NOT EXISTS`-style DDL,
 * so applying the set is idempotent and safe to re-run (P2.2: "no retries — or
 * only if migrations are proven idempotent").
 */

/**
 * Ordered canonical governance migrations, applied lowest-numbered first.
 * The numeric prefix of the LAST entry is the canonical target schema version
 * (see `canonicalTargetSchemaVersion`).
 */
export const CANONICAL_GOVERNANCE_MIGRATION_FILES = [
  "0007_canonical_governance_spine.sql",
  "0008_application_persistence.sql",
  "0009_document_intake.sql",
  "0010_external_data_connectors.sql",
  "0011_rule_overlay_registry.sql",
  "0012_review_workflows.sql",
  "0013_operator_review_queues.sql",
  "0014_document_storage_handoffs.sql",
  "0015_partner_workflows.sql",
  "0016_certified_connector_adapters.sql",
  "0017_regulated_decision_notices.sql",
  "0018_review_transition_controls.sql",
  "0019_borrower_notice_deliveries.sql",
  "0020_borrower_notice_delivery_receipts.sql",
  "0021_borrower_notice_exception_resolutions.sql",
  "0022_borrower_notice_provider_executions.sql",
  "0023_external_connector_executions.sql",
  "0024_report_records.sql",
  "0025_billing_events.sql",
  "0026_payment_connector_controls.sql",
  "0027_live_action_readiness_reviews.sql",
  "0028_credentialed_agency_ingestion.sql",
  "0029_sovereign_consent_gateway_records.sql",
  "0030_scraper_source_governance.sql",
  "0031_revenue_source_intelligence_governance.sql",
  "0032_external_source_stack_governance.sql",
  "0033_environmental_compliance_records.sql",
  "0034_service_requests.sql",
  "0035_treasury_spine.sql",
  "0036_named_tester_acceptance.sql",
  "0037_recommendation_release_records.sql",
  "0038_recommendation_release_authority.sql",
] as const;

/** Directory holding the canonical governance migration SQL files. */
export function canonicalGovernanceMigrationDir(): string {
  return path.join(process.cwd(), "src", "lib", "db", "migrations");
}

/** Absolute path to one canonical governance migration file. */
export function canonicalGovernanceMigrationPath(fileName: string): string {
  return path.join(canonicalGovernanceMigrationDir(), fileName);
}

/**
 * The canonical target schema version = the numeric prefix of the last ordered
 * migration file (e.g. "0033"). Recorded in the deployment manifest as
 * `schemaVersion` (P2.2).
 */
export function canonicalTargetSchemaVersion(): string {
  const last =
    CANONICAL_GOVERNANCE_MIGRATION_FILES[
      CANONICAL_GOVERNANCE_MIGRATION_FILES.length - 1
    ];
  return last.split("_")[0];
}

/**
 * Apply the full ordered canonical governance migration set on an already-open
 * client. The CALLER owns the transaction boundary (BEGIN/COMMIT/ROLLBACK) so
 * both the operator CLI and the staging schema operation can wrap this in a
 * single atomic unit. `log` is invoked once per applied file.
 */
export async function applyCanonicalGovernanceMigrations(
  client: PoolClient,
  log: (message: string) => void = () => {}
): Promise<{ appliedFiles: string[]; targetSchemaVersion: string }> {
  const appliedFiles: string[] = [];

  for (const fileName of CANONICAL_GOVERNANCE_MIGRATION_FILES) {
    const sql = await readFile(
      canonicalGovernanceMigrationPath(fileName),
      "utf8"
    );
    await client.query(sql);
    appliedFiles.push(fileName);
    log(`Applied migration: ${fileName}`);
  }

  return {
    appliedFiles,
    targetSchemaVersion: canonicalTargetSchemaVersion(),
  };
}
