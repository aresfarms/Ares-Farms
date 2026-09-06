import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { effectiveRole } from "@/lib/auth/sessionAuthority";
import {
  publicMatchesForRequest,
  refreshCapitalMatches,
  selectProviderForRequest,
} from "@/lib/financing/capitalNetworkStore";
import {
  capitalNetworkGovernanceContext,
  recordCapitalNetworkEvidence,
} from "@/lib/financing/capitalNetworkGovernance";

function traceId(action: string) {
  return `capital-network-match-${action}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function publicSafeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const safe = [
    "Financing request was not found for that reference and email.",
    "That provider is not currently eligible for borrower selection on this case.",
    "That provider is not active for case assignment.",
  ];
  return safe.includes(message)
    ? message
    : "Capital Network matching is temporarily unavailable. Please try again later.";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const action = String(body.action ?? "public-list");
  const trace = traceId(action);
  const actorId =
    action === "public-list" || action === "select"
      ? `borrower-proof:${String(body.serviceRequestId ?? "").trim().toUpperCase()}`
      : req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() || null;
  const governanceContext = capitalNetworkGovernanceContext({
    operation: `capital-network.match.${action}`,
    traceId: trace,
    actorId,
    classificationLevel: "RESTRICTED",
    metadata: { action },
  });
  if (!governanceContext.runtimeGuard.allowed) {
    return NextResponse.json({ ok: false, error: "Capital Network runtime governance blocked this operation.", governance: { traceId: trace } }, { status: 403 });
  }
  try {
    if (action === "public-list") {
      const matches = await publicMatchesForRequest(String(body.serviceRequestId ?? ""), String(body.email ?? ""), trace);
      const evidence = await recordCapitalNetworkEvidence({
        traceId: trace,
        operation: "capital-network.match.public-list",
        actorId,
        eventType: "CAPITAL_NETWORK_MATCHES_REFRESHED",
        message: "Borrower-authorized Capital Network match snapshots were refreshed without sharing the case.",
        targetId: String(body.serviceRequestId ?? ""),
        metadata: { matchCount: matches.length, dataShared: false },
      });
      return NextResponse.json({
        ok: true,
        matches,
        governance: {
          traceId: trace,
          advisoryOnly: true,
          noCreditDecision: true,
          dataSharedByListing: false,
          evidence: evidence.evidence,
        },
      });
    }
    if (action === "select") {
      const result = await selectProviderForRequest(
        String(body.serviceRequestId ?? ""),
        String(body.email ?? ""),
        String(body.providerId ?? ""),
        trace,
      );
      const evidence = await recordCapitalNetworkEvidence({
        traceId: trace,
        operation: "capital-network.match.select",
        actorId,
        eventType: "CAPITAL_NETWORK_PROVIDER_SELECTED",
        message: "The borrower selected a Capital Network provider; no file was disclosed or delivered by selection.",
        targetId: String(body.serviceRequestId ?? ""),
        metadata: { providerId: String(body.providerId ?? ""), dataShared: false },
      });
      return NextResponse.json({
        ok: true,
        ...result,
        governance: {
          traceId: trace,
          exactPackageConsentStillRequired: true,
          recipientVerificationStillRequired: true,
          dataShared: false,
          evidence: evidence.evidence,
        },
      });
    }
    if (action === "recompute") {
      const access = evaluateAccess({
        role: effectiveRole(req),
        allowedRoles: ["operator", "admin", "governance"],
        operation: "capital-network.matches.recompute",
        module: "api.capital-network.matches",
        traceId: trace,
        actorId,
      });
      if (!access.allowed) return NextResponse.json({ ok: false, error: "Capital Desk authority is required.", governance: { traceId: trace } }, { status: 403 });
      const result = await refreshCapitalMatches(String(body.serviceRequestId ?? ""), actorId ?? "capital-desk", trace);
      const evidence = await recordCapitalNetworkEvidence({
        traceId: trace,
        operation: "capital-network.match.recompute",
        actorId,
        eventType: "CAPITAL_NETWORK_MATCHES_RECOMPUTED",
        message: "The Capital Desk recomputed lender-neutral provider matches.",
        targetId: result.request.serviceRequestId,
        metadata: { matchCount: result.matches.length, dataShared: false },
      });
      return NextResponse.json({
        ok: true,
        serviceRequestId: result.request.serviceRequestId,
        matches: result.matches,
        governance: { traceId: trace, advisoryOnly: true, affiliationDoesNotAffectScore: true, evidence: evidence.evidence },
      });
    }
    return NextResponse.json({ ok: false, error: "Unknown Capital Network match action.", governance: { traceId: trace } }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: publicSafeError(error),
        governance: { traceId: trace },
      },
      { status: 400 },
    );
  }
}
