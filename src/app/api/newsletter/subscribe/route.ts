import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { subscribeToDispatch } from "@/lib/notifications/newsletterSubscribe";

/**
 * Dispatch Newsletter Subscribe API.
 *
 * Minimum PII: takes an email + consent, hands it to the ESP mailing list (no
 * parallel Furlong PII store), and records a governed observability event —
 * never logging the email itself. Governance: runtime guard + observability +
 * evidence; consent captured on the form.
 */

function createTraceId(): string {
  return `newsletter-subscribe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json()) as { email?: string; consent?: boolean };

    if (!body.consent) {
      return NextResponse.json(
        { ok: false, error: "Please confirm you'd like the Dispatch." },
        { status: 400 }
      );
    }

    const runtimeGuard = runRuntimeGuard({
      operation: "customer.newsletter.subscribe",
      module: "api.newsletter.subscribe",
      traceId,
      schemaVersion: "newsletter-subscribe-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: null,
      metadata: { route: "/api/newsletter/subscribe" },
    });

    const result = runtimeGuard.allowed
      ? await subscribeToDispatch(body.email ?? "")
      : { subscribed: false, mode: "error" as const };

    const observability = createObservabilityEvent({
      eventType: "NEWSLETTER_SUBSCRIBE",
      domain: "operations",
      severity: result.subscribed ? "INFO" : "WARN",
      message: `Dispatch subscribe (${result.mode}).`,
      traceId,
      replayRef: traceId,
      module: "api.newsletter.subscribe",
      // Never log the email address.
      metadata: { route: "/api/newsletter/subscribe", mode: result.mode },
    });
    await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: { route: "/api/newsletter/subscribe", mode: result.mode },
    }).catch(() => {});

    // A subscribe that isn't wired yet still returns ok to the visitor — the
    // intent is recorded; delivery turns on when the ESP list is configured.
    return NextResponse.json({ ok: true, subscribed: result.subscribed });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not subscribe right now. Please try again." },
      { status: 500 }
    );
  }
}
