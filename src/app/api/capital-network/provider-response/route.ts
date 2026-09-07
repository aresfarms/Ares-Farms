import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";
import { evaluateProfessionalAccess } from "@/lib/auth/professionalAccessAuthority";
import { recordCapitalNetworkEvidence } from "@/lib/financing/capitalNetworkGovernance";
import { recordManagedProviderResponse } from "@/lib/financing/capitalNetworkStore";
import {
  PROVIDER_RESPONSE_LABELS,
  type ProviderResponseStatus,
} from "@/lib/financing/managedProviderHandoff";

function traceId() {
  return `capital-network-provider-response-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const STATUSES = new Set<ProviderResponseStatus>([
  "ACCEPT_FOR_REVIEW",
  "MISSING_INFORMATION",
  "OUTSIDE_CREDIT_BOX",
  "CONDITIONAL_PATH",
  "DECLINE",
]);

export async function POST(req: NextRequest) {
  const trace = traceId();
  const role = effectiveRole(req);
  const email = req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() || null;
  if (role !== "broker" && role !== "lender") {
    return NextResponse.json({ ok: false, error: "A verified provider identity is required.", governance: { traceId: trace } }, { status: 403 });
  }
  const access = await evaluateProfessionalAccess({
    principalId: req.headers.get("x-ares-authenticated-user-id") ?? email,
    principalEmail: email,
    requestedRole: role,
  });
  if (!access.allowed || !access.providerId) {
    return NextResponse.json({ ok: false, error: "Provider authority is not active.", governance: { traceId: trace } }, { status: 403 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const status = String(body.status ?? "") as ProviderResponseStatus;
    if (!STATUSES.has(status)) throw new Error("Select one of the five permitted provider responses.");
    const list = (value: unknown) => Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : [];
    const room = await recordManagedProviderResponse({
      serviceRequestId: String(body.serviceRequestId ?? "").trim().toUpperCase(),
      providerId: access.providerId,
      status,
      summary: typeof body.summary === "string" ? body.summary : null,
      missingItems: list(body.missingItems),
      conditions: list(body.conditions),
      offerTerms: body.offerTerms && typeof body.offerTerms === "object"
        ? body.offerTerms as Record<string, unknown>
        : null,
      actorId: email ?? access.providerId,
      traceId: trace,
    });
    const evidence = await recordCapitalNetworkEvidence({
      traceId: trace,
      operation: "capital-network.provider-response.record",
      actorId: email ?? access.providerId,
      eventType: "CAPITAL_NETWORK_PROVIDER_RESPONSE_RECORDED",
      message: `Provider returned structured response: ${PROVIDER_RESPONSE_LABELS[status]}.`,
      targetId: room.serviceRequestId,
      metadata: {
        providerId: access.providerId,
        status,
        submissionCaseId: room.submissionCaseId,
      },
    });
    return NextResponse.json({
      ok: true,
      response: {
        status,
        label: PROVIDER_RESPONSE_LABELS[status],
        respondedAt: room.providerRespondedAt?.toISOString() ?? null,
      },
      governance: {
        traceId: trace,
        providerBound: true,
        creditDecisionRemainsWithProvider: true,
        evidence: evidence.evidence,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider response could not be recorded.";
    return NextResponse.json({ ok: false, error: message, governance: { traceId: trace } }, { status: 400 });
  }
}
