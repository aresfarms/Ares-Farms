import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer
} from 'drizzle-orm/pg-core';

/**
 * Pipeline run = one full underwriting execution
 */
export const pipelineRuns = pgTable('pipeline_runs', {
  id: uuid('id').primaryKey(),

  userId: text('user_id'),

  pipelineVersion: text('pipeline_version').notNull(),

  finalDecision: text('final_decision'),

  compositeScore: text('composite_score'),

  traceId: uuid('trace_id'),

  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Every stage execution event (fully replayable)
 */
export const pipelineEvents = pgTable('pipeline_events', {
  id: uuid('id').primaryKey(),

  traceId: uuid('trace_id').notNull(),

  stage: text('stage').notNull(),

  sequence: integer('sequence').notNull(),

  payload: jsonb('payload').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Full snapshot for time-travel / replay
 */
export const pipelineReplays = pgTable('pipeline_replays', {
  id: uuid('id').primaryKey(),

  traceId: uuid('trace_id').notNull(),

  snapshot: jsonb('snapshot').notNull(),

  pipelineVersion: text('pipeline_version').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Rule-level audit ledger (EXPLAINABLE AI layer)
 */
export const pipelineRuleTrace = pgTable('pipeline_rule_trace', {
  id: uuid('id').primaryKey(),

  traceId: uuid('trace_id').notNull(),

  layer: text('layer').notNull(),

  rule: text('rule').notNull(),

  impact: text('impact').notNull(),

  before: text('before'),

  after: text('after'),

  reason: text('reason'),

  createdAt: timestamp('created_at').defaultNow().notNull()
});
