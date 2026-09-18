import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Immutable technical boundary for all synthetic/test records. */
export const syntheticFixtureLineageRecords = pgTable(
  "synthetic_fixture_lineage_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    syntheticPersonaId: text("synthetic_persona_id").notNull(),
    humanVisibleName: text("human_visible_name").notNull(),
    testRunId: text("test_run_id").notNull(),
    fixtureVersion: text("fixture_version").notNull(),
    registryVersion: text("registry_version").notNull(),
    lineageVersion: text("lineage_version").notNull(),
    environment: text("environment").notNull(),
    operatorIdentity: text("operator_identity").notNull(),
    fixtureCreatedAt: timestamp("fixture_created_at", {
      withTimezone: true,
    }).notNull(),
    scenarioId: text("scenario_id").notNull(),
    providerTargets: jsonb("provider_targets").notNull(),
    recordType: text("record_type").notNull(),
    recordId: text("record_id").notNull(),
    lineageSha256: text("lineage_sha256").notNull(),
    lineagePayload: jsonb("lineage_payload").notNull(),
    governanceVersion: text("governance_version").notNull(),
    classification: text("classification").notNull().default("RESTRICTED"),
    replayRef: text("replay_ref").notNull(),
    traceId: text("trace_id").notNull(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("synthetic_fixture_record_uq").on(
      table.recordType,
      table.recordId,
    ),
    uniqueIndex("synthetic_fixture_lineage_sha_uq").on(table.lineageSha256),
  ],
);

export type SyntheticFixtureLineageRow =
  typeof syntheticFixtureLineageRecords.$inferSelect;
