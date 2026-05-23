import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";

export const canonicalLedger = pgTable(
  "canonical_ledger",
  {
    id: uuid("id").primaryKey(),

    userId: text("user_id").notNull(),
    eventType: text("event_type").notNull(),
    decision: text("decision").notNull(),

    compositeScore: numeric("composite_score").notNull(),
    riskScore: numeric("risk_score").notNull(),

    input: jsonb("input").notNull().default({}),
    output: jsonb("output").notNull().default({}),
    trace: jsonb("trace").notNull().default({}),

    prevHash: text("prev_hash"),
    eventHash: text("event_hash").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    idIdx: index("canonical_ledger_id_idx").on(table.id),
    userIdx: index("canonical_ledger_user_idx").on(table.userId),
    eventIdx: index("canonical_ledger_event_idx").on(table.eventType),
    hashIdx: index("canonical_ledger_hash_idx").on(table.eventHash),
  })
);
