import { NextRequest, NextResponse } from "next/server";

import {
  completeRecordFor,
  requestDataRight,
  type RightsRequestType,
} from "@/lib/privacy/dataRights";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";

/**
 * My Data — the person's own access, portability and rights requests
 * (GDPR Art. 15 / 16 / 17 / 20; equivalent US state rights).
 *
 * POST {action:"export", serviceRequestId, email}
 *   → everything held about them, machine-readable (portability) and
 *     human-readable in the same payload.
 * POST {action:"request", serviceRequestId, email, type, detail}
 *   → records an erasure / rectification / restriction request for human
 *     action. Never mutates a regulated lending file automatically.
 *
 * Authentication is the same minimum-disclosure proof used everywhere:
 * reference + matching email. A mismatch is silent — it never reveals
 * whether a reference exists.
 */

const VALID_TYPES: RightsRequestType[] = ["erasure", "rectification", "restriction"];

export async function POST(req: NextRequest) {
  const traceId = `my-data-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let body: {
    action?: unknown;
    serviceRequestId?: unknown;
    email?: unknown;
    type?: unknown;
    detail?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const dealRef = typeof body.serviceRequestId === "string" ? body.serviceRequestId : "";
  const email = typeof body.email === "string" ? body.email : "";
  const action = typeof body.action === "string" ? body.action : "export";

  if (action === "request") {
    const type = VALID_TYPES.includes(body.type as RightsRequestType)
      ? (body.type as RightsRequestType)
      : null;
    if (!type) {
      return NextResponse.json({ ok: false, error: "Choose what you would like us to do." }, { status: 400 });
    }
    const result = await requestDataRight({
      dealRef,
      email,
      type,
      detail: typeof body.detail === "string" ? body.detail : null,
    });
    if (!result.recorded) {
      // Same silence as a failed lookup — never confirm a reference exists.
      return NextResponse.json(
        { ok: false, error: "We could not match that reference and email." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      ok: true,
      reference: result.reference,
      message:
        "Your request is recorded and goes to a person, not a script — a regulated lending file is " +
        "never altered automatically. You will hear back within 30 days, sooner where the law requires it.",
    });
  }

  const record = await completeRecordFor(dealRef, email);
  if (!record) {
    return NextResponse.json(
      { ok: false, error: "We could not match that reference and email." },
      { status: 404 }
    );
  }
  createObservabilityEvent({
    eventType: "DATA_SUBJECT_ACCESS",
    domain: "security",
    severity: "INFO",
    message: "A person exercised their right of access to their own record.",
    traceId,
    replayRef: traceId,
    actorId: `customer-via-status-link:${record.dealRef}`,
    module: "api.public.my-data",
    metadata: { dealRef: record.dealRef, categories: record.categories.length },
  });
  return NextResponse.json({ ok: true, record });
}
