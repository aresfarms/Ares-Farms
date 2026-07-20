import { NextRequest, NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/property/auditLedger";
import { persistOperatorReviewQueueItem } from "@/lib/queues/operatorReviewQueueStore";
import { sanitizeIngestText } from "@/lib/security/ingestSanitizer";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

/**
 * Bound-edition waitlist (ALPHA — founder direction 2026-07-20). A physical
 * bound edition of a tract's ledger is a future Guild benefit; this is the
 * REAL waitlist so reservers are first in line when it opens.
 *
 * PII POSTURE — this is the ONE place the free surface asks who you are, and it
 * is a CONSCIOUS, EXPLICIT OPT-IN (founder direction 2026-07-20: "we obviously
 * really do want to know who they are"):
 *   - Collects NAME + EMAIL only. NO mailing address here — a shipping address
 *     is only ever taken later, at actual fulfillment, inside the identified
 *     Guild. Minimum PII for the stated purpose ("tell you first").
 *   - The contact PII lives ONLY in the operator queue item (the fulfillment
 *     surface the operator monitors to notify reservers). It is deliberately
 *     kept OUT of the audit ledger (which is broadly persisted/replayed) — the
 *     audit records only that a contactable reservation was made, never the raw
 *     name/email.
 *   - COUNSEL GATE: real PII collection is on Stuart's compliance review (#34)
 *     before this faces the public; alpha runs on IAP-private staging (only
 *     allowlisted testers can reach it), which contains it.
 *
 * Mirrors the governed public-request pattern (see special-building-review).
 */

type BoundEditionWaitlistRequest = {
  propertyId?: string | null;
  title?: string | null;
  location?: string | null;
  propertyType?: string | null;
  binding?: string | null;
  lane?: string | null;
  name?: string | null;
  email?: string | null;
};

// Deliberately permissive shape check — not full RFC validation, just enough to
// reject obvious non-emails before we hold one.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createTraceId() {
  return `public-bound-edition-waitlist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<BoundEditionWaitlistRequest>(req, {
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
  const name = sanitizeIngestText(body.name, 120);
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";

  if (!propertyId || !title) {
    return NextResponse.json(
      { ok: false, error: "A tract reference is required to reserve a bound edition." },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "A name is required to hold your place in line." }, { status: 400 });
  }
  if (!email || !EMAIL_SHAPE.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required so we can tell you when editions open." }, { status: 400 });
  }

  const traceId = createTraceId();
  const reviewReason =
    `Waitlist reservation for a physical bound edition of ${title}` +
    `${binding === "portfolio" ? " (append to Master Portfolio Register)" : " (standalone volume)"}. ` +
    `Contact captured with explicit opt-in — notify first when editions open. No mailing address collected yet.`;

  try {
    const persisted = await persistOperatorReviewQueueItem({
      traceId,
      queueType: "HUMAN_REVIEW",
      sourceType: "BOUND_EDITION_WAITLIST",
      sourceId: propertyId,
      sourceTraceId: traceId,
      actorId: "public-optin-waitlist",
      priority: "NORMAL",
      escalationStatus: "NOT_ESCALATED",
      reviewReason,
      requiredRole: "operator",
      metadata: {
        // Contact PII lives here (fulfillment surface) ONLY — never in the audit.
        contactName: name,
        contactEmail: email,
        classification: "PII_CONTACT",
        consent: "explicit-optin-waitlist-2026-07-20",
        title,
        location,
        propertyType,
        lane,
        binding,
        submittedFrom: "public-property-workspace",
      },
    });

    appendAuditEvent({
      actorId: "public-optin-waitlist",
      actorName: "public-optin-waitlist",
      domain: "public-bound-edition-waitlist",
      subject: propertyId,
      decision: "BOUND_EDITION_WAITLIST_RESERVED",
      // NO raw name/email in the audit ledger — only that a contactable
      // reservation exists, and where to find its PII (the queue item).
      reason: "Visitor joined the bound-edition waitlist with explicit opt-in contact (name + email held in the operator queue).",
      detail: { traceId, queueItemId: persisted.queueItem.id, binding, propertyType, contactCaptured: true },
    });

    return NextResponse.json({
      ok: true,
      traceId,
      message: "You're on the list. We'll email you the moment bound editions open — you'll be first.",
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
