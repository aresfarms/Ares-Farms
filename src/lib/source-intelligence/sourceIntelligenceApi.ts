import { NextRequest, NextResponse } from "next/server";

import {
  SOURCE_INTELLIGENCE_SOURCES,
  SOURCE_INTELLIGENCE_VERSION,
  dispatchSourceIntelligenceAction,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Source Intelligence API Helper
 *
 * Wraps scraper, source-ingestion, and property-discovery routes in the same
 * Master Volume runtime guard, version lineage, classification, observability,
 * replay, and production-block posture used by the rest of the backend.
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

export async function handleSourceIntelligenceRoute(
  req: NextRequest,
  action: string,
  route: string
) {
  const traceId = createTraceId(action);

  try {
    const input = await readInput(req);
    const result = dispatchSourceIntelligenceAction(action, input);
    const moduleName = `api.${route.replace(/^\/api\//, "").replace(/\//g, ".")}`;

    const runtimeGuard = runRuntimeGuard({
      operation: action,
      module: moduleName,
      traceId,
      schemaVersion: SOURCE_INTELLIGENCE_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: (input.actorId as string | null) ?? null,
      metadata: {
        route,
        sourceDocuments: [...SOURCE_INTELLIGENCE_SOURCES],
        liveFetchAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Source intelligence runtime guard blocked the request.",
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
          SOURCE_INTELLIGENCE_VERSION,
          "src/db/schema/scraperSourceGovernance.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          SOURCE_INTELLIGENCE_VERSION,
          SOURCE_INTELLIGENCE_SOURCES.join(" | "),
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          SOURCE_INTELLIGENCE_VERSION,
          "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef("api", SOURCE_INTELLIGENCE_VERSION, route, traceId),
      ],
    });

    const classifiedResult = classifyRecord(result as unknown as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "institutional",
      classificationSource: "source-intelligence-api",
      classificationVersion: SOURCE_INTELLIGENCE_VERSION,
      replayRef: traceId,
      disclosureAudience: ["governance", "operator", "authorized-reviewer"],
      sharingPermissions: ["source-review", "evidence-packet-preparation"],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "candidate-evidence-only-before-review",
        "no-public-verification-authority",
        "no-official-collateral-certification",
      ],
      redactionRequirements: [
        "redact raw credentials",
        "redact borrower-sensitive data for unauthorized audiences",
      ],
    });

    const observability = createObservabilityEvent({
      eventType: "SOURCE_INTELLIGENCE_ROUTE_EXECUTED",
      domain: "connector",
      severity: result.ok ? "INFO" : "WARN",
      message:
        "Governed source intelligence route returned replay-safe runtime metadata.",
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
            : "Unknown source intelligence API error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
