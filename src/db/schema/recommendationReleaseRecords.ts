import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Immutable recommendation-release lineage records. */
export const recommendationReleaseRecords = pgTable("recommendation_release_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectType: text("subject_type").notNull(),
  subjectKey: text("subject_key").notNull(),
  releaseId: text("release_id").notNull().unique(),
  previousReleaseId: text("previous_release_id"),
  evidenceVersion: text("evidence_version").notNull(),
  releaseState: text("release_state").notNull(),
  finality: text("finality").notNull(),
  approvedRecommendationText: text("approved_recommendation_text").notNull(),
  reviewerRecordCount: integer("reviewer_record_count").notNull().default(0),
  conditionCount: integer("condition_count").notNull().default(0),
  materialChangeCount: integer("material_change_count").notNull().default(0),
  supersessionRequired: boolean("supersession_required").notNull().default(false),
  releasePayload: jsonb("release_payload").notNull(),
  changeControlPayload: jsonb("change_control_payload").notNull(),
  historyPayload: jsonb("history_payload").notNull(),
  governanceVersion: text("governance_version").notNull(),
  classification: text("classification").notNull().default("CONFIDENTIAL"),
  replayRef: text("replay_ref"),
  traceId: text("trace_id"),
  source: text("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RecommendationReleaseRecordRow = typeof recommendationReleaseRecords.$inferSelect;
