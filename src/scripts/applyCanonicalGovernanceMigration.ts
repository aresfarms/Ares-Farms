import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

/**
 * Apply Canonical Governance Migrations
 *
 * Master Volume Governance:
 * - Vol I: applies constitutional backend state authority deliberately.
 * - Vol II: creates regulated-data, entitlement, application, document,
 *   connector, rule, overlay, review, adverse-action, and evidence tables.
 * - Vol III: promotes schema, replay, versioning, source authority,
 *   connector governance, rule/overlay governance, review persistence,
 *   operator queues, document storage handoff, lender/sponsor workflows,
 *   certified connector adapters, regulated decision notices, review
 *   transition controls, borrower notice deliveries, borrower notice
 *   delivery receipts, borrower notice exception resolutions, borrower
 *   notice provider execution controls, external connector execution
 *   controls, report records, billing events, payment connector controls,
 *   live action readiness reviews, credentialed agency ingestion controls,
 *   sovereign consent gateway records, scraper/source intelligence governance,
 *   canonical property governance, revenue source intelligence governance,
 *   canonical external source stack governance, source failover,
 *   canonicalization/conflict storage, freshness monitoring, environmental
 *   compliance records, borrower fee-protection controls, and durable runtime
 *   storage.
 * - Vol IV: provides a controlled operator migration step.
 * - Vol V: supports classification, observability, source, replay,
 *   rule lineage, overlay precedence, human review, and version doctrine.
 *
 * Operator rule:
 * Run this only when the active DATABASE_URL is confirmed to be the intended
 * development or controlled migration database.
 */

const migrationFiles = [
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
];

function migrationPath(fileName: string): string {
  return path.join(
    process.cwd(),
    "src",
    "lib",
    "db",
    "migrations",
    fileName
  );
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before applying migrations.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const fileName of migrationFiles) {
      const sql = await readFile(migrationPath(fileName), "utf8");
      await client.query(sql);
      console.log(`Applied migration: ${fileName}`);
    }

    await client.query("COMMIT");

    console.log(
      "Canonical governance migrations applied successfully."
    );
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown canonical governance migration error."
  );
  process.exit(1);
});
