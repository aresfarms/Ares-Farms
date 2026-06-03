import { and, desc, eq } from "drizzle-orm";

import {
  borrowerNoticeDeliveries,
  borrowerNoticeDeliveryReceipts,
  borrowerNoticeExceptionResolutions,
  borrowerNoticeProviderExecutions,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Borrower Notice Admin Read Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves accountable authority for notice lifecycle reads.
 * - Vol II: Protects adverse-action, appeal, delivery, retry, dispute,
 *   and borrower-disclosure records from uncontrolled exposure.
 * - Vol III: Provides deterministic record-scoped notice lifecycle reads.
 * - Vol IV: Supports operator/admin monitoring, recovery, escalation,
 *   audit preparation, and dashboard-safe backend access.
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

export type ListBorrowerNoticeAdminRecordsInput = {
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  deliveryId?: string | null;
  deliveryStatus?: string | null;
  limit?: number | null;
  includeReceipts?: boolean | null;
  includeResolutions?: boolean | null;
  includeProviderExecutions?: boolean | null;
};

export type BorrowerNoticeAdminRecord = {
  delivery: typeof borrowerNoticeDeliveries.$inferSelect;
  providerExecutions: Array<
    typeof borrowerNoticeProviderExecutions.$inferSelect
  >;
  receipts: Array<typeof borrowerNoticeDeliveryReceipts.$inferSelect>;
  resolutions: Array<
    typeof borrowerNoticeExceptionResolutions.$inferSelect
  >;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 25;
  }

  return Math.min(value, 100);
}

function normalizeDeliveryStatus(value: unknown): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

export async function listBorrowerNoticeAdminRecords(
  input: ListBorrowerNoticeAdminRecordsInput
): Promise<BorrowerNoticeAdminRecord[]> {
  const filters = [
    normalizeText(input.deliveryId)
      ? eq(borrowerNoticeDeliveries.id, normalizeText(input.deliveryId) ?? "")
      : undefined,
    normalizeText(input.applicationId)
      ? eq(
          borrowerNoticeDeliveries.applicationId,
          normalizeText(input.applicationId) ?? ""
        )
      : undefined,
    normalizeText(input.borrowerId)
      ? eq(
          borrowerNoticeDeliveries.borrowerId,
          normalizeText(input.borrowerId) ?? ""
        )
      : undefined,
    normalizeText(input.tenantId)
      ? eq(borrowerNoticeDeliveries.tenantId, normalizeText(input.tenantId) ?? "")
      : undefined,
    normalizeDeliveryStatus(input.deliveryStatus)
      ? eq(
          borrowerNoticeDeliveries.deliveryStatus,
          normalizeDeliveryStatus(input.deliveryStatus) ?? ""
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const deliveries = whereClause
    ? await db
        .select()
        .from(borrowerNoticeDeliveries)
        .where(whereClause)
        .orderBy(desc(borrowerNoticeDeliveries.createdAt))
        .limit(normalizeLimit(input.limit))
    : await db
        .select()
        .from(borrowerNoticeDeliveries)
        .orderBy(desc(borrowerNoticeDeliveries.createdAt))
        .limit(normalizeLimit(input.limit));
  const records: BorrowerNoticeAdminRecord[] = [];

  for (const delivery of deliveries) {
    const providerExecutions =
      input.includeProviderExecutions === false
        ? []
        : await db
            .select()
            .from(borrowerNoticeProviderExecutions)
            .where(eq(borrowerNoticeProviderExecutions.deliveryId, delivery.id))
            .orderBy(desc(borrowerNoticeProviderExecutions.createdAt));
    const receipts =
      input.includeReceipts === false
        ? []
        : await db
            .select()
            .from(borrowerNoticeDeliveryReceipts)
            .where(eq(borrowerNoticeDeliveryReceipts.deliveryId, delivery.id))
            .orderBy(desc(borrowerNoticeDeliveryReceipts.createdAt));
    const resolutions =
      input.includeResolutions === false
        ? []
        : await db
            .select()
            .from(borrowerNoticeExceptionResolutions)
            .where(eq(borrowerNoticeExceptionResolutions.deliveryId, delivery.id))
            .orderBy(desc(borrowerNoticeExceptionResolutions.createdAt));

    records.push({
      delivery,
      providerExecutions,
      receipts,
      resolutions,
    });
  }

  return records;
}
