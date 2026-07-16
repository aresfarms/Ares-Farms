import { NextRequest, NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/property/auditLedger";
import { persistOperatorReviewQueueItem } from "@/lib/queues/operatorReviewQueueStore";
import { sanitizeIngestText } from "@/lib/security/ingestSanitizer";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

type SpecialBuildingReviewRequest = {
  propertyId?: string | null;
  title?: string | null;
  location?: string | null;
  exactAddress?: string | null;
  propertyType?: string | null;
  sourceLabel?: string | null;
  currentLabel?: string | null;
  listingUrl?: string | null;
  salePosture?: string | null;
  importScreeningStatus?: string | null;
  importScreeningCategory?: string | null;
  importScreeningSummary?: string | null;
  importScreeningReasons?: string[] | null;
  manualReviewRequired?: boolean | null;
  manualReviewSummary?: string | null;
  requesterNotes?: string | null;
};

function createTraceId() {
  return `public-special-building-review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<SpecialBuildingReviewRequest>(req, {
    maxBytes: 16 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const body = parsed.body;
  const propertyId = typeof body.propertyId === "string" ? body.propertyId.trim() : "";
  const title = sanitizeIngestText(body.title, 160);
  const location = sanitizeIngestText(body.location, 200);
  const exactAddress = sanitizeIngestText(body.exactAddress, 220);
  const propertyType = sanitizeIngestText(body.propertyType, 120);
  const salePosture = typeof body.salePosture === "string" ? body.salePosture.trim() : "";
  const screeningStatus = typeof body.importScreeningStatus === "string" ? body.importScreeningStatus.trim() : "";
  const screeningCategory = typeof body.importScreeningCategory === "string" ? body.importScreeningCategory.trim() : "";
  const requesterNotes = sanitizeIngestText(body.requesterNotes, 1200);

  if (!propertyId || !title || !location || !propertyType) {
    return NextResponse.json({ ok: false, error: "Property context is incomplete for manual review submission." }, { status: 400 });
  }

  if (!body.manualReviewRequired || screeningStatus !== "reroute") {
    return NextResponse.json({ ok: false, error: "This property is not eligible for special-building manual review submission." }, { status: 422 });
  }

  if (salePosture !== "official-disposition-source") {
    return NextResponse.json({ ok: false, error: "Manual review submission is only allowed after the property shows an official public disposition or verified for-sale posture." }, { status: 422 });
  }

  const traceId = createTraceId();
  const reviewReason =
    `Public portal submitted a special-building manual review request for ${title}. ` +
    `Restricted/special asset posture requires human verification before any further handling.`;

  try {
    const persisted = await persistOperatorReviewQueueItem({
      traceId,
      queueType: "HUMAN_REVIEW",
      sourceType: "SPECIAL_BUILDING_MANUAL_REVIEW",
      sourceId: propertyId,
      sourceTraceId: traceId,
      actorId: "public-anonymous",
      priority: screeningCategory === "restricted-asset" ? "HIGH" : "NORMAL",
      escalationStatus: screeningCategory === "restricted-asset" ? "ESCALATION_REVIEW_REQUIRED" : "NOT_ESCALATED",
      reviewReason,
      requiredRole: "governance",
      metadata: {
        title,
        location,
        exactAddress,
        propertyType,
        sourceLabel: sanitizeIngestText(body.sourceLabel, 120),
        currentLabel: sanitizeIngestText(body.currentLabel, 120),
        listingUrl: sanitizeIngestText(body.listingUrl, 500),
        salePosture,
        importScreeningStatus: screeningStatus,
        importScreeningCategory: screeningCategory,
        importScreeningSummary: sanitizeIngestText(body.importScreeningSummary, 240),
        importScreeningReasons: Array.isArray(body.importScreeningReasons)
          ? body.importScreeningReasons.map((line) => sanitizeIngestText(line, 240)).filter(Boolean)
          : [],
        manualReviewSummary: sanitizeIngestText(body.manualReviewSummary, 320),
        requesterNotes,
        submittedFrom: "public-property-workspace",
      },
    });

    appendAuditEvent({
      actorId: "public-anonymous",
      actorName: "public-anonymous",
      domain: "public-special-building-review",
      subject: propertyId,
      decision: "SPECIAL_BUILDING_MANUAL_REVIEW_SUBMITTED",
      reason: "Restricted/special asset was submitted from the public portal into the manual review queue.",
      detail: {
        traceId,
        queueItemId: persisted.queueItem.id,
        screeningCategory,
        salePosture,
        manualReviewRequired: true,
      },
    });

    return NextResponse.json({
      ok: true,
      queueItemId: persisted.queueItem.id,
      traceId,
      message: "Special building review was submitted for manual Furlong handling.",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "The special building review could not be queued.",
    }, { status: 500 });
  }
}
