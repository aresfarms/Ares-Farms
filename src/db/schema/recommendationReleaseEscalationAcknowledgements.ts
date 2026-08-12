import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const recommendationReleaseEscalationAcknowledgements = pgTable("recommendation_release_escalation_acknowledgements", {
  id: uuid("id").defaultRandom().primaryKey(),
  releaseId: text("release_id").notNull(),
  attestationCycleId: text("attestation_cycle_id").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectKey: text("subject_key").notNull(),
  actorId: text("actor_id").notNull(),
  actorEmail: text("actor_email").notNull(),
  actorName: text("actor_name"),
  actorRole: text("actor_role").notNull(),
  acknowledgementStatement: text("acknowledgement_statement").notNull(),
  traceId: text("trace_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  oneAcknowledgementPerActor: uniqueIndex("recommendation_release_escalation_ack_actor_uniq").on(table.releaseId, table.attestationCycleId, table.actorId),
}));

export type RecommendationReleaseEscalationAcknowledgementRow = typeof recommendationReleaseEscalationAcknowledgements.$inferSelect;
