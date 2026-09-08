import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { evaluateAccess, type AccessRole } from "@/lib/auth/accessControl";
import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import {
  appendFurlongCaseEvent,
  loadFurlongCase,
  loadFurlongCaseBundle,
  recordFurlongCaseOutcome,
  type FurlongCaseStage,
  saveFurlongCase,
} from "@/lib/intelligence/furlongCaseStore";
import { composeIntelligenceCaseWorkspace } from "@/lib/intelligence/intelligenceCaseWorkspaceRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import { containsProtectedClassDisclosure, REDACTED_PLACEHOLDER } from "@/lib/navigator/navigatorSessionPrivacy";

const READ_ROLES: AccessRole[] = ["user", "borrower", "lender", "sponsor", "operator", "governance", "admin", "auditor"];
const WRITE_ROLES: AccessRole[] = ["user", "borrower", "operator", "governance", "admin"];
const VERIFY_OUTCOME_ROLES = new Set(["operator", "governance", "admin"]);
const PRIVILEGED_CASE_READ_ROLES = new Set(["operator", "governance", "admin", "auditor"]);
const PRIVILEGED_CASE_WRITE_ROLES = new Set(["operator", "governance", "admin"]);

function traceId(action: string, caseId: string): string {
  return `intelligence-case-${action}-${caseId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function split(value: string | null): string[] {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("An outcome timestamp is invalid.");
  return parsed;
}

function safeCaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const allowed = [
    "A valid Furlong case identifier is required.",
    "Invalid Furlong case stage.",
    "Verified case outcomes require at least one evidence reference.",
    "An outcome timestamp is invalid.",
    "Save the Furlong Case before adding events or outcomes.",
  ];
  return allowed.includes(message)
    ? message
    : "The Furlong Case could not be updated. Please try again or contact support if the issue persists.";
}

function mayReadDurableCase(role: string, actorId: string | null, ownerActorId: string | null): boolean {
  if (PRIVILEGED_CASE_READ_ROLES.has(role)) return true;
  return Boolean(actorId && ownerActorId && actorId === ownerActorId);
}

function mayWriteDurableCase(role: string, actorId: string | null, ownerActorId: string | null): boolean {
  if (PRIVILEGED_CASE_WRITE_ROLES.has(role)) return true;
  return Boolean(actorId && ownerActorId && actorId === ownerActorId);
}

async function durableBundleOrUnavailable(caseId: string) {
  try {
    return { persistenceAvailable: true, durableCase: await loadFurlongCaseBundle(caseId) };
  } catch (error) {
    // Controlled-promotion compatibility: source may be ahead of a staging DB
    // migration. The advisory workspace still renders, but persistence is never
    // falsely claimed until the canonical migrations are present.
    return {
      persistenceAvailable: false,
      durableCase: null,
      persistenceNote: error instanceof Error
        ? "The living-case persistence layer is awaiting its governed database migration."
        : "The living-case persistence layer is not available.",
    };
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  const caseId = (await context.params).caseId.trim();
  if (!/^[A-Za-z0-9:_-]{1,160}$/.test(caseId)) return NextResponse.json({ ok: false, error: "A valid Furlong case identifier is required." }, { status: 400 });
  const authority = sessionAuthority(req);
  const trace = traceId("read", caseId);
  const runtimeGuard = runRuntimeGuard({
    operation: "intelligence.case.read",
    module: "api.intelligence.cases",
    traceId: trace,
    schemaVersion: "intelligence-workspace-v1",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    replayRef: trace,
    actorId: authority.actorId,
    metadata: { route: "/api/intelligence/cases/[caseId]", caseId, authorityBasis: authority.basis },
  });
  const access = evaluateAccess({
    role: authority.role,
    allowedRoles: READ_ROLES,
    operation: "intelligence.case.read",
    module: "api.intelligence.cases",
    traceId: trace,
    actorId: authority.actorId,
  });
  if (!runtimeGuard.allowed || !access.allowed || !authority.actorId) {
    return NextResponse.json({ ok: false, error: "Authorized case access is required.", governance: { traceId: trace, runtimeGuard, access } }, { status: 403 });
  }

  const workspace = composeIntelligenceCaseWorkspace({
    caseId,
    actorId: authority.actorId,
    displayName: req.nextUrl.searchParams.get("name"),
    goal: req.nextUrl.searchParams.get("goal"),
    state: req.nextUrl.searchParams.get("state"),
    customerTypes: split(req.nextUrl.searchParams.get("customerTypes")),
    intendedUses: split(req.nextUrl.searchParams.get("intendedUses")),
  });
  const durable = await durableBundleOrUnavailable(caseId);
  if (durable.durableCase && !mayReadDurableCase(authority.role, authority.actorId, durable.durableCase.record.ownerActorId)) {
    return NextResponse.json({ ok: false, error: "Case not found or access not authorized." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json({
    ok: true,
    workspace,
    ...durable,
    governance: {
      traceId: trace,
      runtimeGuard,
      access,
      advisoryOnly: true,
      noCreditDecision: true,
      noEnvironmentalClearance: true,
      actorAuthorityDerivedFromSession: true,
    },
  }, { headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
}

export async function POST(req: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  const caseId = (await context.params).caseId.trim();
  if (!/^[A-Za-z0-9:_-]{1,160}$/.test(caseId)) return NextResponse.json({ ok: false, error: "A valid Furlong case identifier is required." }, { status: 400 });
  const parsed = await readJsonBodyWithLimit<Record<string, unknown>>(req, { maxBytes: 128 * 1024 });
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  if (!parsed.body || Array.isArray(parsed.body) || typeof parsed.body !== "object") return NextResponse.json({ ok: false, error: "A case request object is required." }, { status: 400 });
  const body = parsed.body;

  const authority = sessionAuthority(req);
  const action = nullableString(body.action)?.toLowerCase() ?? "save";
  const trace = traceId(action, caseId);
  const runtimeGuard = runRuntimeGuard({
    operation: `intelligence.case.${action}`,
    module: "api.intelligence.cases",
    traceId: trace,
    schemaVersion: "furlong-case-v1",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    replayRef: trace,
    actorId: authority.actorId,
    metadata: { route: "/api/intelligence/cases/[caseId]", caseId, action, authorityBasis: authority.basis },
  });
  const access = evaluateAccess({
    role: authority.role,
    allowedRoles: WRITE_ROLES,
    operation: `intelligence.case.${action}`,
    module: "api.intelligence.cases",
    traceId: trace,
    actorId: authority.actorId,
  });
  if (!runtimeGuard.allowed || !access.allowed || !authority.actorId) {
    return NextResponse.json({ ok: false, error: "Authenticated customer or operator authority is required to change a case.", governance: { traceId: trace, runtimeGuard, access } }, { status: 403 });
  }

  try {
    const existing = await loadFurlongCase(caseId);
    if (existing && !mayWriteDurableCase(authority.role, authority.actorId, existing.ownerActorId)) {
      return NextResponse.json({ ok: false, error: "Case not found or access not authorized." }, { status: 404 });
    }
    if (!existing && action !== "save") {
      return NextResponse.json({ ok: false, error: "Save the Furlong Case before adding events or outcomes." }, { status: 404 });
    }
    const effectiveCaseId = existing?.caseId ?? randomUUID();
    if (action === "save") {
      const supplied = record(body.case);
      // A partial snapshot must not erase previously saved evidence or permissions.
      const payload = { ...(existing ?? {}), ...supplied };
      const isOperator = PRIVILEGED_CASE_WRITE_ROLES.has(authority.role);
      if (!isOperator) {
        payload.currentStage = existing?.currentStage ?? "PROPERTY_ANALYSIS";
        payload.caseStatus = existing?.caseStatus ?? "OPEN";
        payload.outcomeStatus = existing?.outcomeStatus ?? "NOT_STARTED";
        payload.permissionState = existing?.permissionState ?? { providerSharingAuthorized: false };
        payload.providerSelections = existing?.providerSelections ?? [];
        payload.borrowerReadiness = existing?.borrowerReadiness ?? {};
        payload.environmentalContext = existing?.environmentalContext ?? {};
        payload.capitalContext = existing?.capitalContext ?? {};
        payload.documentRefs = existing?.documentRefs ?? [];
      }
      await saveFurlongCase({
        caseId: effectiveCaseId,
        customerId: nullableString(payload.customerId),
        propertyId: nullableString(payload.propertyId),
        propertyAddress: nullableString(payload.propertyAddress),
        customerGoal: containsProtectedClassDisclosure(nullableString(payload.customerGoal) ?? "") ? REDACTED_PLACEHOLDER : nullableString(payload.customerGoal),
        currentStage: (nullableString(payload.currentStage) as FurlongCaseStage | null) ?? "PROPERTY_ANALYSIS",
        caseStatus: nullableString(payload.caseStatus) ?? undefined,
        outcomeStatus: nullableString(payload.outcomeStatus) ?? undefined,
        propertySnapshot: record(payload.propertySnapshot),
        businessContext: record(payload.businessContext),
        borrowerReadiness: record(payload.borrowerReadiness),
        environmentalContext: record(payload.environmentalContext),
        capitalContext: record(payload.capitalContext),
        documentRefs: strings(payload.documentRefs),
        permissionState: record(payload.permissionState),
        providerSelections: Array.isArray(payload.providerSelections)
          ? payload.providerSelections.map(record)
          : [],
        metadata: record(payload.metadata),
      }, authority.actorId, trace);
    } else if (action === "append-event") {
      await appendFurlongCaseEvent({
        caseId,
        idempotencyKey: nullableString(body.idempotencyKey) ?? undefined,
        eventType: nullableString(body.eventType) ?? "CUSTOMER_CASE_NOTE",
        eventStatus: nullableString(body.eventStatus) ?? undefined,
        summary: nullableString(body.summary) ?? "Case activity recorded.",
        detail: record(body.detail),
        evidenceRefs: strings(body.evidenceRefs),
        actorId: authority.actorId,
        traceId: trace,
      });
    } else if (action === "record-outcome") {
      const requestedVerified = body.verified === true;
      const verified = requestedVerified && VERIFY_OUTCOME_ROLES.has(authority.role);
      await recordFurlongCaseOutcome({
        caseId,
        serviceRequestId: nullableString(body.serviceRequestId),
        providerId: nullableString(body.providerId),
        executionRef: nullableString(body.executionRef),
        outcomeType: nullableString(body.outcomeType) ?? "OUTCOME_RECORDED",
        outcomeReasonCategory: nullableString(body.outcomeReasonCategory),
        conditions: strings(body.conditions),
        financingStructure: Object.keys(record(body.financingStructure)).length ? record(body.financingStructure) : null,
        actualRateBps: typeof body.actualRateBps === "number" ? body.actualRateBps : null,
        actualProjectCost: typeof body.actualProjectCost === "number" ? body.actualProjectCost : null,
        environmentalOutcome: nullableString(body.environmentalOutcome),
        submittedAt: optionalDate(body.submittedAt),
        providerRespondedAt: optionalDate(body.providerRespondedAt),
        acceptedAt: optionalDate(body.acceptedAt),
        declinedAt: optionalDate(body.declinedAt),
        closedAt: optionalDate(body.closedAt),
        evidenceRefs: strings(body.evidenceRefs),
        actorId: authority.actorId,
        verified,
        traceId: trace,
      });
    } else {
      return NextResponse.json({ ok: false, error: "Unknown Furlong Case action.", governance: { traceId: trace } }, { status: 400 });
    }

    const durableCase = await loadFurlongCaseBundle(effectiveCaseId);
    return NextResponse.json({
      ok: true,
      action,
      persistenceAvailable: true,
      durableCase,
      governance: {
        traceId: trace,
        runtimeGuard,
        access,
        actorAuthorityDerivedFromSession: true,
        requestedVerifiedOutcomeAccepted: action === "record-outcome" && body.verified === true && VERIFY_OUTCOME_ROLES.has(authority.role),
        advisoryOnly: true,
        noCreditDecision: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeCaseError(error), governance: { traceId: trace } }, { status: 400 });
  }
}
