import { NextRequest, NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/property/auditLedger";
import { persistOperatorReviewQueueItem } from "@/lib/queues/operatorReviewQueueStore";
import { sanitizeIngestText } from "@/lib/security/ingestSanitizer";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

/**
 * Bound-edition interest (ALPHA "mock the desire" — founder direction
 * 2026-07-20). Records that an anonymous visitor RESERVED a place in line for a
 * physical bound edition of a tract's ledger, so demand is measurable and the
 * operator (Furlong) can HAND-fulfill hero copies. This is a waitlist SIGNAL —
 * NOT fulfillment: no payment, no shipping, no Guild token, and critically NO
 * PERSONAL PII. The anonymous surface never collects a name, email, or address;
 * a shipping address only ever lives inside the identified, opt-in Guild. So
 * this endpoint accepts PROPERTY CONTEXT ONLY and refuses to store anything
 * personal — the Sovereignty Guarantee stays unbent on the free side.
 *
 * Mirrors the governed public-request pattern (see special-building-review):
 * anonymous actor, sanitized inputs, operator-queue persistence + audit event.
 */

type BoundEditionInterestRequest = {
  propertyId?: string | null;
  title?: string | null;
  location?: string | null;
  propertyType?: string | null;
  /** "standalone" volume, or append to the member's "portfolio" master register. */
  binding?: string | null;
  lane?: string | null;
};

function createTraceId() {
  return `public-bound-edition-interest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<BoundEditionInterestRequest>(req, {
    maxBytes: 8 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const body = parsed.body;
  const propertyId = typeof body.propertyId === "string" ? body.propertyId.trim().slice(0, 200) : "";
  const title = sanitizeIngestText(body.title, 160);
  const location = sanitizeIngestText(body.location, 200);
  const propertyType = sanitizeIngestText(body.propertyType, 120);
  const lane = sanitizeIngestText(body.lane, 80);
  const bindingRaw = typeof body.binding === "string" ? body.binding.trim().toLowerCase() : "";
  const binding = bindingRaw === "portfolio" ? "portfolio" : "standalone";

  if (!propertyId || !title) {
    return NextResponse.json(
      { ok: false, error: "A tract reference is required to reserve a bound edition." },
      { status: 400 }
    );
  }

  const traceId = createTraceId();
  const reviewReason =
    `Anonymous visitor reserved a place in line for a physical bound edition of ${title}` +
    `${binding === "portfolio" ? " (append to Master Portfolio Register)" : " (standalone volume)"}. ` +
    `Alpha demand signal — hand-fulfill for hero testers; no payment, shipping, or PII captured.`;

  try {
    const persisted = await persistOperatorReviewQueueItem({
      traceId,
      queueType: "HUMAN_REVIEW",
      sourceType: "BOUND_EDITION_INTEREST",
      sourceId: propertyId,
      sourceTraceId: traceId,
      actorId: "public-anonymous",
      priority: "NORMAL",
      escalationStatus: "NOT_ESCALATED",
      reviewReason,
      requiredRole: "operator",
      metadata: {
        title,
        location,
        propertyType,
        lane,
        binding,
        submittedFrom: "public-property-workspace",
        note: "Waitlist demand signal only — no personal data collected on the anonymous surface.",
      },
    });

    appendAuditEvent({
      actorId: "public-anonymous",
      actorName: "public-anonymous",
      domain: "public-bound-edition-interest",
      subject: propertyId,
      decision: "BOUND_EDITION_RESERVATION_EXPRESSED",
      reason: "Anonymous visitor reserved a place in line for a physical bound edition (alpha demand signal).",
      detail: { traceId, queueItemId: persisted.queueItem.id, binding, propertyType },
    });

    return NextResponse.json({
      ok: true,
      traceId,
      message: "Your place is reserved. Bound editions arrive with the Guild — we'll bring it up when it opens.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "The reservation could not be recorded.",
      },
      { status: 500 }
    );
  }
}
