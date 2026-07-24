import { createHash, randomUUID } from "node:crypto";

import { desc, sql } from "drizzle-orm";

import { auditEvents } from "@/db/schema";
import { db } from "@/lib/db";

import { hashAuditEvent } from "./hashAuditEvent";

export type AuditEventInput = {
  userId?: string | null;
  eventType?: string | null;
  decision?: unknown;
  entityType?: string | null;
  entityId?: string | null;
  payload?: unknown;
  metadata?: Record<string, unknown>;
  classification?: string | null;
  source?: string | null;
  traceId?: string | null;
  moduleId?: string | null;
  anonymousId?: string | null;
  [key: string]: unknown;
};

export type AuditEventRecord = {
  ok: true;
  mode: "durable-canonical";
  id: string;
  auditId: string;
  eventHash: string;
  prevHash: string;
  traceId: string | null;
  moduleId: string | null;
  anonymousId: string | null;
  timestamp: string;
  governance: {
    canonicalWriter: true;
    durable: true;
    replayReady: true;
    classificationRequired: true;
    observable: true;
    hashChained: true;
  };
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function decisionText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

function pseudonymousActorUuid(seed: string): string {
  const hex = createHash("sha256")
    .update(seed)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function extractIdentity(input: AuditEventInput) {
  const metadata = record(input.metadata);
  const payload = record(input.payload);
  const traceId =
    text(input.traceId) ?? text(metadata.traceId) ?? text(payload.traceId);
  const moduleId =
    text(input.moduleId) ??
    text(metadata.moduleId) ??
    text(metadata.module) ??
    text(payload.moduleId) ??
    text(payload.module) ??
    text(input.source);
  const anonymousId =
    text(input.anonymousId) ??
    text(metadata.anonymousId) ??
    text(payload.anonymousId) ??
    (text(input.userId)?.startsWith("anon:")
      ? (text(input.userId)?.slice(5) ?? null)
      : null);

  return { metadata, payload, traceId, moduleId, anonymousId };
}

export async function writeAuditEvent(
  input: AuditEventInput = {},
): Promise<AuditEventRecord> {
  const id = randomUUID();
  const timestamp = new Date();
  const { metadata, payload, traceId, moduleId, anonymousId } =
    extractIdentity(input);
  const classification = text(input.classification) ?? "RESTRICTED";
  const source = text(input.source) ?? moduleId ?? "canonical-audit-writer";
  const suppliedUserId = text(input.userId);
  const userId =
    suppliedUserId && UUID_PATTERN.test(suppliedUserId)
      ? suppliedUserId
      : pseudonymousActorUuid(
          `furlong-audit-actor:${anonymousId ?? suppliedUserId ?? moduleId ?? "system"}`,
        );
  const canonicalPayload = {
    data: input.payload ?? null,
    metadata,
    traceId,
    moduleId,
    anonymousId,
  };
  const trace = {
    traceId,
    replayRef: text(metadata.replayRef) ?? traceId,
    moduleId,
    anonymousId,
  };

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('furlong.audit_events.chain.v1'))`,
    );
    const [head] = await tx
      .select({ eventHash: auditEvents.eventHash, hash: auditEvents.hash })
      .from(auditEvents)
      .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
      .limit(1);
    const prevHash = head?.eventHash ?? head?.hash ?? "GENESIS";
    const eventHash = hashAuditEvent({
      prev_hash: prevHash,
      payload: {
        id,
        timestamp: timestamp.toISOString(),
        eventType: text(input.eventType) ?? "AUDIT_EVENT",
        entityType: text(input.entityType),
        entityId: text(input.entityId),
        decision: decisionText(input.decision),
        classification,
        source,
        canonicalPayload,
        trace,
      },
    });

    await tx.insert(auditEvents).values({
      id,
      userId,
      eventType: text(input.eventType) ?? "AUDIT_EVENT",
      entityType: text(input.entityType),
      entityId: text(input.entityId),
      decision: decisionText(input.decision),
      input: metadata,
      output: {},
      trace,
      payload: canonicalPayload,
      prevHash,
      eventHash,
      hash: eventHash,
      classification,
      source,
      createdAt: timestamp,
    });

    return {
      ok: true,
      mode: "durable-canonical",
      id,
      auditId: id,
      eventHash,
      prevHash,
      traceId,
      moduleId,
      anonymousId,
      timestamp: timestamp.toISOString(),
      governance: {
        canonicalWriter: true,
        durable: true,
        replayReady: true,
        classificationRequired: true,
        observable: true,
        hashChained: true,
      },
    };
  });
}
