import { NextRequest, NextResponse } from "next/server";

import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import {
  SOURCE_STACK_SOURCES,
  SOURCE_STACK_VERSION,
  dispatchSourceStackAction,
} from "@/lib/source-stack/sourceStackRuntime";

/**
 * Source Stack API Helper
 *
 * Wraps external source discovery, canonicalization, failover, conflicts,
 * freshness, market signals, geospatial suitability, and program/revenue
 * aliases in Master Volume runtime controls. Outputs remain advisory,
 * replay-safe, classified, public-DTO-bound, and human-review-required.
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

export async function handleSourceStackRoute(
  req: NextRequest,
  action: string,
  route: string
) {
  const traceId = createTraceId(action);

  try {
    const input = await readInput(req);
    const result = dispatchSourceStackAction(action, input);
    const moduleName = `api.${route.replace(/^\/api\//, "").replace(/\//g, ".")}`;

    const runtimeGuard = runRuntimeGuard({
      operation: action,
      module: moduleName,
      traceId,
      schemaVersion: SOURCE_STACK_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: (input.actorId as string | null) ?? null,
      metadata: {
        route,
        sourceDocuments: [...SOURCE_STACK_SOURCES],
        advisoryOnly: true,
        liveFetchAllowed: false,
        publicDtoRequired: true,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Source stack runtime guard blocked the request.",
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
          SOURCE_STACK_VERSION,
          "src/db/schema/externalSourceStackGovernance.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          SOURCE_STACK_VERSION,
          SOURCE_STACK_SOURCES.join(" | "),
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          SOURCE_STACK_VERSION,
          "src/lib/source-stack/sourceStackRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef("api", SOURCE_STACK_VERSION, route, traceId),
      ],
    });

    const classifiedResult = classifyRecord(
      result as unknown as Record<string, unknown>,
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "institutional",
        classificationSource: "source-stack-api",
        classificationVersion: SOURCE_STACK_VERSION,
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
          "advisory-source-discovery",
          "canonicalization-review",
          "source-conflict-review",
          "evidence-packet-preparation",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "advisory-only",
          "no-underwriting-reliance",
          "no-collateral-certification",
          "no-lender-commitment-claims",
          "no-legal-advice",
        ],
        redactionRequirements: [
          "redact raw credentials",
          "redact restricted source payloads before public DTO use",
        ],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "SOURCE_STACK_ROUTE_EXECUTED",
      domain: "operations",
      severity: result.ok ? "INFO" : "WARN",
      message:
        "Governed source stack route returned replay-safe advisory metadata.",
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
            : "Unknown source stack API error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
