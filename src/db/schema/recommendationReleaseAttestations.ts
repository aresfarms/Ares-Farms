import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const recommendationReleaseAttestations = pgTable("recommendation_release_attestations", {
  id: uuid("id").defaultRandom().primaryKey(),
  releaseId: text("release_id").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectKey: text("subject_key").notNull(),
  reviewerActorId: text("reviewer_actor_id").notNull(),
  reviewerEmail: text("reviewer_email").notNull(),
  reviewerName: text("reviewer_name"),
  reviewerRole: text("reviewer_role").notNull(),
  authorityBasis: text("authority_basis").notNull(),
  attestationStatement: text("attestation_statement").notNull(),
  decisionContext: jsonb("decision_context").notNull(),
  traceId: text("trace_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  oneAttestationPerReviewer: uniqueIndex("recommendation_release_attestation_reviewer_uniq").on(table.releaseId, table.reviewerActorId),
}));

export type RecommendationReleaseAttestationRow = typeof recommendationReleaseAttestations.$inferSelect;
