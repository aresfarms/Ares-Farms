import { NextRequest, NextResponse } from "next/server";

import {
  GOVERNANCE_VERSION,
  MISSING_DOCTRINES_SOURCE,
  MISSING_DOCTRINES_VERSION,
  dispatchMissingDoctrineAction,
} from "@/lib/governance/constitutionalDoctrineRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Constitutional Doctrine API Helper
 *
 * Provides the shared governance envelope for the supplemental missing
 * doctrine APIs: runtime state, feature governance, claims, incidents,
 * configuration, UX governance, and implementation traceability.
 */

function createTraceId(action: string): string {
  return `${action}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  if (req.method !== "POST") {
    return {};
  }

  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function handleConstitutionalDoctrineRoute(
  req: NextRequest,
  action: string,
  route: string
) {
  const traceId = createTraceId(action);

  try {
    const body = await readBody(req);
    const result = dispatchMissingDoctrineAction(action, body);

    const runtimeGuard = runRuntimeGuard({
      operation: action,
      module: `api.${route.replace(/^\/api\//, "").replace(/\//g, ".")}`,
      traceId,
      schemaVersion: MISSING_DOCTRINES_VERSION,
      governanceVersion: GOVERNANCE_VERSION,
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      actorId: (body.actorId as string | null) ?? null,
      metadata: {
        route,
        source: MISSING_DOCTRINES_SOURCE,
        supplementalDoctrine: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Constitutional doctrine runtime guard blocked the request.",
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
      module: `api.${route.replace(/^\/api\//, "").replace(/\//g, ".")}`,
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          MISSING_DOCTRINES_VERSION,
          "src/db/schema/missingDoctrineGovernance.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          GOVERNANCE_VERSION,
          MISSING_DOCTRINES_SOURCE,
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          MISSING_DOCTRINES_VERSION,
          "src/lib/governance/constitutionalDoctrineRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef("api", MISSING_DOCTRINES_VERSION, route, traceId),
      ],
    });

    const classifiedResult = classifyRecord(
      result as Record<string, unknown>,
      {
        classificationLevel: "INTERNAL",
        sensitivityScope: "governance",
        classificationSource: "constitutional-doctrine-api",
        classificationVersion: MISSING_DOCTRINES_VERSION,
        replayRef: traceId,
        disclosureAudience: ["governance", "operator"],
        sharingPermissions: ["governance-runtime-review"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: ["no-public-production-reliance"],
        redactionRequirements: ["remove-secret-values-before-export"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "CONSTITUTIONAL_DOCTRINE_ROUTE_EXECUTED",
      domain: "operations",
      severity: "INFO",
      message:
        "Supplemental constitutional doctrine route returned governed runtime metadata.",
      traceId,
      replayRef: traceId,
      module: `api.${route.replace(/^\/api\//, "").replace(/\//g, ".")}`,
      metadata: {
        action,
        route,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: (result as { ok?: boolean }).ok ?? true,
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
            : "Unknown constitutional doctrine API error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
