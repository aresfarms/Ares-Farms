import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { evaluateAccess } from "@/lib/auth/accessControl";
import { effectiveRole } from "@/lib/auth/sessionAuthority";
import { evaluateProfessionalAccess } from "@/lib/auth/professionalAccessAuthority";
import {
  assertSelectedProviderForSubmission,
  getCapitalProvider,
  listCapitalDealRoomsForCapitalDesk,
  listProviderDealRooms,
  publicProvider,
  recordCapitalNetworkExecutionOutcome,
} from "@/lib/financing/capitalNetworkStore";
import type { CapitalExecutionOutcome } from "@/lib/financing/capitalNetworkExecutionReliability";
import { recordCapitalNetworkEvidence } from "@/lib/financing/capitalNetworkGovernance";
import { createSubmissionCase } from "@/lib/lender-submission/store";

function traceId(action: string) {
  return `capital-network-deal-room-${action}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function actorEmail(req: NextRequest): string | null {
  return req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() || null;
}

function internalAllowed(req: NextRequest, trace: string): boolean {
  return evaluateAccess({
    role: effectiveRole(req),
    allowedRoles: ["operator", "admin", "governance"],
    operation: "capital-network.deal-room.internal",
    module: "api.capital-network.deal-room",
    traceId: trace,
    actorId: actorEmail(req),
  }).allowed;
}

export async function GET(req: NextRequest) {
  const trace = traceId("list");
  if (req.nextUrl.searchParams.get("all") === "1") {
    if (!internalAllowed(req, trace)) {
      return NextResponse.json(
        { ok: false, error: "Capital Desk authority is required.", governance: { traceId: trace } },
        { status: 403 },
      );
    }
    const rooms = await listCapitalDealRoomsForCapitalDesk();
    return NextResponse.json({
      ok: true,
      rooms,
      governance: {
        traceId: trace,
        internalCapitalDeskView: true,
        providerAccessStillCaseScoped: true,
      },
    });
  }

  const role = effectiveRole(req);
  const email = actorEmail(req);
  let providerId: string | null = null;
  if (role === "governance" || role === "admin") {
    providerId = req.nextUrl.searchParams.get("providerId")?.trim() || null;
  } else if (role === "broker" || role === "lender") {
    const access = await evaluateProfessionalAccess({
      principalId: req.headers.get("x-ares-authenticated-user-id") ?? email,
      principalEmail: email,
      requestedRole: role,
    });
    if (access.allowed) providerId = access.providerId;
  }
  if (!providerId) {
    return NextResponse.json(
      { ok: false, error: "A verified provider identity is required for this deal room.", governance: { traceId: trace } },
      { status: 403 },
    );
  }
  const provider = await getCapitalProvider(providerId);
  if (!provider) {
    return NextResponse.json(
      { ok: false, error: "Provider profile was not found.", governance: { traceId: trace } },
      { status: 404 },
    );
  }
  const rooms = await listProviderDealRooms(providerId);
  return NextResponse.json({
    ok: true,
    provider: publicProvider(provider),
    rooms,
    governance: {
      traceId: trace,
      exactAssignmentOnly: true,
      providerAccessRequiresPackageConsent: true,
    },
  });
}

export async function POST(req: NextRequest) {
  const trace = traceId("action");
  const actorId = actorEmail(req);
  if (!internalAllowed(req, trace)) {
    return NextResponse.json(
      { ok: false, error: "Capital Desk authority is required.", governance: { traceId: trace } },
      { status: 403 },
    );
  }
  try {
    const body = await req.json() as {
      action?: string;
      serviceRequestId?: string;
      providerId?: string;
      outcome?: CapitalExecutionOutcome;
      outcomeReasonCategory?: string | null;
      providerFirstResponseAt?: string | null;
      providerDispositionAt?: string | null;
      closedFundedAt?: string | null;
      evidenceRefs?: string[];
    };
    const serviceRequestId = (body.serviceRequestId ?? "").trim().toUpperCase();
    const providerId = (body.providerId ?? "").trim();
    if (!serviceRequestId || !providerId) {
      throw new Error("serviceRequestId and providerId are required.");
    }
    if (body.action === "record-execution-outcome") {
      const allowed = new Set<CapitalExecutionOutcome>([
        "CLOSED_FUNDED", "PROVIDER_DECLINED", "PROVIDER_WITHDREW", "PROVIDER_NO_RESPONSE",
        "BORROWER_WITHDREW", "PROPERTY_OR_PROGRAM_BLOCKED", "THIRD_PARTY_OR_EXTERNAL_BLOCKED", "CANCELED",
      ]);
      if (!body.outcome || !allowed.has(body.outcome)) throw new Error("A valid Capital Network execution outcome is required.");
      const parseDate = (value?: string | null) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw new Error("Execution milestone dates must be valid ISO date/time values.");
        return date;
      };
      const record = await recordCapitalNetworkExecutionOutcome({
        serviceRequestId,
        providerId,
        outcome: body.outcome,
        outcomeReasonCategory: body.outcomeReasonCategory,
        providerFirstResponseAt: parseDate(body.providerFirstResponseAt),
        providerDispositionAt: parseDate(body.providerDispositionAt),
        closedFundedAt: parseDate(body.closedFundedAt),
        evidenceRefs: Array.isArray(body.evidenceRefs) ? body.evidenceRefs : [],
        actorId: actorId ?? "capital-desk",
        traceId: trace,
      });
      const evidence = await recordCapitalNetworkEvidence({
        traceId: trace,
        operation: "capital-network.execution.record-verified-outcome",
        actorId,
        eventType: "CAPITAL_NETWORK_EXECUTION_OUTCOME_VERIFIED",
        message: "Capital Desk recorded an evidence-backed provider execution outcome for future reliability history.",
        targetId: serviceRequestId,
        metadata: { providerId, outcome: record.outcome, executionRecordId: record.id, personalFinancialScoring: false },
      });
      return NextResponse.json({
        ok: true,
        executionRecord: record,
        governance: {
          traceId: trace,
          evidence: evidence.evidence,
          evidenceBacked: true,
          compensationInfluence: false,
          affiliationInfluence: false,
          personalFinancialScoring: false,
        },
      }, { status: 201 });
    }
    if (body.action !== "create-submission-case") {
      throw new Error("Unsupported Capital Network deal-room action.");
    }
    const selection = await assertSelectedProviderForSubmission(serviceRequestId, providerId);
    if (selection.room.submissionCaseId) {
      return NextResponse.json({
        ok: true,
        submissionCaseId: selection.room.submissionCaseId,
        alreadyExists: true,
        governance: { traceId: trace, providerBound: true },
      });
    }
    const [request] = await db
      .select()
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.serviceRequestId, serviceRequestId),
          eq(serviceRequests.requestType, "financing_deal_intake"),
        ),
      )
      .limit(1);
    if (!request) throw new Error("Financing request was not found.");
    const customerId = request.userId?.trim() || request.contactEmail?.trim().toLowerCase() || "";
    if (!customerId) throw new Error("The financing request has no borrower identity for package consent.");
    const submission = await createSubmissionCase({
      applicationId: `finintake-${serviceRequestId}`,
      customerId,
      providerId,
      serviceRequestId,
      actorId: actorId ?? "capital-desk",
      traceId: trace,
    });
    const evidence = await recordCapitalNetworkEvidence({
      traceId: trace,
      operation: "capital-network.deal-room.create-submission-case",
      actorId,
      eventType: "CAPITAL_NETWORK_SUBMISSION_CASE_CREATED",
      message: "A provider-bound lender-submission case was created from a borrower-selected Capital Network deal room.",
      targetId: serviceRequestId,
      metadata: { providerId, submissionCaseId: submission.id, dataShared: false },
    });
    return NextResponse.json({
      ok: true,
      submissionCaseId: submission.id,
      alreadyExists: false,
      governance: {
        traceId: trace,
        providerBound: true,
        exactPackageConsentRequired: true,
        dataShared: false,
        evidence: evidence.evidence,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission case creation failed.";
    const safe = /required|not found|no borrower identity|borrower-selected|missing|stale|active/i.test(message)
      ? message
      : "The provider-bound submission case could not be created.";
    return NextResponse.json({ ok: false, error: safe, governance: { traceId: trace } }, { status: 400 });
  }
}
