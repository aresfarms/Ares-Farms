/**
 * Canonical DB Schema Compatibility Bridge
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Preserves one governed schema authority.
 *
 * - Vol II: Regulatory Governance
 *   Supports controlled schema access for regulated records.
 *
 * - Vol III: Technical Infrastructure
 *   Prevents duplicate schema definitions during migration.
 *
 * - Vol IV: Operational Runbooks
 *   Supports safe operational migration of legacy imports.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enables replayability, versioning, observability, explainability,
 *   and future canonical citation lineage.
 *
 * Purpose:
 * Legacy imports using:
 *
 *   "@/lib/db/schema"
 *
 * are redirected to the canonical schema spine:
 *
 *   "@/db/schema"
 */

export * from "@/db/schema";

export type AuditEvent = {
  id: string;
  eventType?: string | null;
  event_type?: string | null;
  entityType?: string | null;
  entity_type?: string | null;
  entityId?: string | null;
  entity_id?: string | null;
  payload?: unknown;
  prevHash?: string | null;
  prev_hash?: string | null;
  eventHash?: string | null;
  event_hash?: string | null;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
  [key: string]: unknown;
};
