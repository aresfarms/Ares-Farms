import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { effectiveRole } from "@/lib/auth/sessionAuthority";
import {
  createProviderApplication,
  listCapitalProviders,
  publicProvider,
} from "@/lib/financing/capitalNetworkStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { recordCapitalNetworkEvidence } from "@/lib/financing/capitalNetworkGovernance";

function traceId(action: string) {
  return `capital-network-provider-${action}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emailFrom(req: NextRequest): string | null {
  return req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() || null;
}

export async function GET(req: NextRequest) {
  const trace = traceId("list");
  const publicOnly = req.nextUrl.searchParams.get("public") === "1";
  if (publicOnly) {
    const rows = await listCapitalProviders({ status: "CERTIFIED_ACTIVE" });
    return NextResponse.json({
      ok: true,
      providers: rows.filter((row) => row.matchingEnabled).map(publicProvider),
      governance: { traceId: trace, advisoryOnly: true },
    });
  }

  const role = effectiveRole(req);
  const email = emailFrom(req);
  const mine = req.nextUrl.searchParams.get("mine") === "1";
  if (mine && email) {
    const rows = await listCapitalProviders({ contactEmail: email });
    return NextResponse.json({ ok: true, providers: rows, governance: { traceId: trace } });
  }
  const access = evaluateAccess({
    role,
    allowedRoles: ["operator", "admin", "governance"],
    operation: "capital-network.providers.list",
    module: "api.capital-network.providers",
    traceId: trace,
    actorId: email,
  });
  if (!access.allowed) {
    return NextResponse.json({ ok: false, error: "Internal Capital Network access is required.", governance: { traceId: trace } }, { status: 403 });
  }
  const rows = await listCapitalProviders();
  return NextResponse.json({ ok: true, providers: rows, governance: { traceId: trace } });
}

export async function POST(req: NextRequest) {
  const trace = traceId("apply");
  const email = emailFrom(req);
  const role = effectiveRole(req);
  const access = evaluateAccess({
    role,
    allowedRoles: ["user", "broker", "lender", "operator", "admin", "governance"],
    operation: "capital-network.provider.apply",
    module: "api.capital-network.providers",
    traceId: trace,
    actorId: email,
  });
  const guard = runRuntimeGuard({
    operation: "capital-network.provider.apply",
    module: "api.capital-network.providers",
    traceId: trace,
    schemaVersion: "capital-network-provider-v1.0.0",
    governanceVersion: "capital-network-v1.1.0",
    classificationLevel: "CONFIDENTIAL",
    replayRef: trace,
    actorId: email,
  });
  if (!email || !access.allowed || !guard.allowed) {
    return NextResponse.json({ ok: false, error: "An authenticated applicant session is required.", governance: { traceId: trace } }, { status: 403 });
  }
  try {
    const body = await req.json();
    const privileged = role === "governance" || role === "admin";
    const provider = await createProviderApplication({
      organizationName: String(body.organizationName ?? ""),
      providerRole: String(body.providerRole ?? "").toUpperCase() as "BROKER" | "LENDER",
      providerType: String(body.providerType ?? "OTHER"),
      primaryContactEmail: privileged && body.primaryContactEmail ? String(body.primaryContactEmail) : email,
      website: body.website ? String(body.website) : null,
      states: Array.isArray(body.states) ? body.states : [],
      programs: Array.isArray(body.programs) ? body.programs : [],
      purposes: Array.isArray(body.purposes) ? body.purposes : [],
      propertyTypes: Array.isArray(body.propertyTypes) ? body.propertyTypes : [],
      industries: Array.isArray(body.industries) ? body.industries : [],
      borrowerTypes: Array.isArray(body.borrowerTypes) ? body.borrowerTypes : [],
      minDealAmount: typeof body.minDealAmount === "number" ? body.minDealAmount : null,
      maxDealAmount: typeof body.maxDealAmount === "number" ? body.maxDealAmount : null,
      acceptsBrokeredDeals: body.acceptsBrokeredDeals === true,
      acceptsDirectBorrower: body.acceptsDirectBorrower === true,
      affiliation: privileged && body.affiliation === "FURLONG_AFFILIATE" ? "FURLONG_AFFILIATE" : "INDEPENDENT",
    }, email, trace);
    const governanceEvidence = await recordCapitalNetworkEvidence({
      traceId: trace,
      operation: "capital-network.provider.apply",
      actorId: email,
      eventType: "CAPITAL_NETWORK_PROVIDER_APPLICATION_CREATED",
      message: "A Capital Network provider application was recorded in a non-active state.",
      targetId: provider.providerId,
      metadata: {
        providerRole: provider.providerRole,
        providerType: provider.providerType,
        status: provider.status,
        matchingEnabled: false,
        liveRoutingAllowed: false,
      },
    });
    return NextResponse.json({
      ok: true,
      provider,
      governance: {
        traceId: trace,
        status: "APPLICANT",
        matchingEnabled: false,
        liveRoutingAllowed: false,
        evidence: governanceEvidence.evidence,
        note: "Application creates no public listing, borrower-data access, routing authority, or compensation right.",
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const safe = /required|providerRole|https:\/\//i.test(message)
      ? message
      : "Provider application could not be recorded. Please try again or contact Furlong.";
    return NextResponse.json({ ok: false, error: safe, governance: { traceId: trace } }, { status: 400 });
  }
}
