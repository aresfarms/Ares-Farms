import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export type PromotionAuditEvent = {
  type:
    | "PROMOTION_ATTEMPT"
    | "LOCK_ACQUIRED"
    | "VALIDATION_PASSED"
    | "PROMOTION_COMMITTED"
    | "PROMOTION_FAILED"
    | "ROLLBACK_TRIGGERED";

  versionFrom?: number;
  versionTo?: number;

  metadata?: any;
  status: "STARTED" | "SUCCESS" | "FAILED";
};

export async function writePromotionAudit(event: PromotionAuditEvent) {
  await db.execute(sql`
    INSERT INTO canonical_promotion_events (
      event_type,
      status,
      version_from,
      version_to,
      metadata,
      created_at
    )
    VALUES (
      ${event.type},
      ${event.status},
      ${event.versionFrom ?? null},
      ${event.versionTo ?? null},
      ${JSON.stringify(event.metadata ?? {})},
      now()
    );
  `);
}
