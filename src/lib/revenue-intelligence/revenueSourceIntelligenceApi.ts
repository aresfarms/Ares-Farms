import { NextRequest, NextResponse } from "next/server";

import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import {
  REVENUE_SOURCE_INTELLIGENCE_SOURCES,
  REVENUE_SOURCE_INTELLIGENCE_VERSION,
  dispatchRevenueSourceIntelligenceAction,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Revenue Source Intelligence API Helper
 *
 * Wraps revenue, program, catalog, market, operating-cost, geospatial,
 * regulatory, customer-type, and fusion endpoints in Master Volume runtime
 * guardrails. All outputs remain classified, replay-safe, advisory, and
 * human-review-bound.
 */

function createTraceId(action: string): string {
  return `${action}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

async function readInput(req: NextRequest): Promise<Record<string, unknown>> {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());

  if (req.method !== "POST") {
    return query;
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;

    return {
      ...query,
      ...body,
    };
  } catch {
    return query;
  }
}

export async function handleRevenueSourceIntelligenceRoute(
  req: NextRequest,
  action: string,
  route: string
) {
  const traceId = createTraceId(action);

  try {
    const input = await readInput(req);
    const result = dispatchRevenueSourceIntelligenceAction(action, input);
    const moduleName = `api.${route.replace(/^\/api\//, "").replace(/\//g, ".")}`;

    const runtimeGuard = runRuntimeGuard({
      operation: action,
      module: moduleName,
      traceId,
      schemaVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: (input.actorId as string | null) ?? null,
      metadata: {
        route,
        sourceDocuments: [...REVENUE_SOURCE_INTELLIGENCE_SOURCES],
        advisoryOnly: true,
        liveSourceRefreshAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Revenue source intelligence runtime guard blocked the request.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: action,
      module: moduleName,
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          REVENUE_SOURCE_INTELLIGENCE_VERSION,
          "src/db/schema/revenueSourceIntelligenceGovernance.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          REVENUE_SOURCE_INTELLIGENCE_VERSION,
          REVENUE_SOURCE_INTELLIGENCE_SOURCES.join(" | "),
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          REVENUE_SOURCE_INTELLIGENCE_VERSION,
          "src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          REVENUE_SOURCE_INTELLIGENCE_VERSION,
          route,
          traceId
        ),
      ],
    });

    const classifiedResult = classifyRecord(result as unknown as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "institutional",
      classificationSource: "revenue-source-intelligence-api",
      classificationVersion: REVENUE_SOURCE_INTELLIGENCE_VERSION,
      replayRef: traceId,
      disclosureAudience: [
        "governance",
        "operator",
        "authorized-reviewer",
        "borrower",
        "lender",
        "sponsor",
      ],
      sharingPermissions: [
        "advisory-revenue-planning",
        "source-review",
        "evidence-packet-preparation",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "advisory-only",
        "no-guaranteed-revenue-claims",
        "no-program-approval-claims",
        "no-legal-advice",
        "no-underwriting-reliance",
      ],
      redactionRequirements: [
        "redact raw credentials",
        "redact borrower-sensitive data for unauthorized audiences",
      ],
    });

    const observability = createObservabilityEvent({
      eventType: "REVENUE_SOURCE_INTELLIGENCE_ROUTE_EXECUTED",
      domain: "operations",
      severity: result.ok ? "INFO" : "WARN",
      message:
        "Governed revenue source intelligence route returned replay-safe advisory metadata.",
      traceId,
      replayRef: traceId,
      module: moduleName,
      metadata: {
        action,
        route,
        ok: result.ok,
        blockedReasons: result.blockedReasons,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: result.ok,
      data: classifiedResult,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        observability,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown revenue source intelligence API error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
