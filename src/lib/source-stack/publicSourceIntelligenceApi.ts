import { NextRequest, NextResponse } from "next/server";

import {
  PublicSourceIntelligenceKind,
  buildPublicSourceIntelligencePayload,
  publicSourceIntelligencePayloadIsRedacted,
} from "@/lib/dto/publicSourceIntelligence";
import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { SOURCE_STACK_SOURCES, SOURCE_STACK_VERSION } from "@/lib/platform/authorities/source";

/**
 * Public Source Intelligence API Helper
 *
 * Implements Volume VI public-safe aliases for grants, property discovery,
 * equipment, market context, and weather risk. These routes return governed
 * DTOs only and preserve advisory, human-review, no-live-fetch, and
 * production-blocked posture.
 */

function createTraceId(kind: PublicSourceIntelligenceKind): string {
  return `public-source-${kind}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function handlePublicSourceIntelligenceRoute(
  req: NextRequest,
  kind: PublicSourceIntelligenceKind,
  route: string
) {
  const traceId = createTraceId(kind);

  try {
    const runtimeGuard = runRuntimeGuard({
      operation: `public.source-intelligence.${kind}`,
      module: `api.public.${kind}`,
      traceId,
      schemaVersion: SOURCE_STACK_VERSION,
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "PUBLIC",
      replayRef: traceId,
      metadata: {
        route,
        sourceDocuments: [...SOURCE_STACK_SOURCES],
        query: Object.fromEntries(req.nextUrl.searchParams.entries()),
        publicDtoOnly: true,
        classificationFiltering: true,
        claimsGovernance: true,
        redactionRules: true,
        rateLimitingRequired: true,
        advisoryOnly: true,
        liveFetchAllowed: false,
        productionBlocked: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked public source intelligence.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: `public.source-intelligence.${kind}`,
      module: `api.public.${kind}`,
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          SOURCE_STACK_VERSION,
          "src/lib/dto/publicSourceIntelligence.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          SOURCE_STACK_VERSION,
          "Ares Volume VI Source Intelligence Integration Master",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          SOURCE_STACK_VERSION,
          "src/lib/source-stack/publicSourceIntelligenceApi.ts",
          traceId
        ),
        createRuntimeVersionRef("api", SOURCE_STACK_VERSION, route, traceId),
      ],
    });

    const payload = buildPublicSourceIntelligencePayload(kind);
    const redacted = publicSourceIntelligencePayloadIsRedacted(payload);
    const claimsEvaluation = evaluateContentClaims({
      text: [
        kind,
        ...payload.statusMessages,
        ...payload.disclosures,
        ...payload.blockedClaims,
        ...payload.items.map((item) =>
          [
            item.title,
            item.category,
            item.reviewStatus,
            item.authorityPosture,
          ].join(" ")
        ),
      ],
      context: {
        publicVerificationGatewayOperational: false,
        canonicalHashVerificationOperational: false,
        officialDecisionAuthority: false,
      },
    });

    if (!redacted || !claimsEvaluation.ok) {
      const observability = createObservabilityEvent({
        eventType: "PUBLIC_SOURCE_INTELLIGENCE_BLOCKED",
        domain: "security",
        severity: "ERROR",
        message:
          "Public source intelligence response blocked by redaction or claims governance.",
        traceId,
        replayRef: traceId,
        module: `api.public.${kind}`,
        metadata: {
          kind,
          route,
          redacted,
          blockCount: claimsEvaluation.blockCount,
          reviewCount: claimsEvaluation.reviewCount,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Public source intelligence governance failed.",
          governance: {
            traceId,
            runtimeGuard,
            versionRuntime,
            claimsEvaluation,
            observability,
          },
        },
        { status: 409 }
      );
    }

    const classifiedPayload = classifyRecord(payload, {
      classificationLevel: "PUBLIC",
      sensitivityScope: "public",
      classificationSource: `api-public-${kind}`,
      classificationVersion: SOURCE_STACK_VERSION,
      replayRef: traceId,
      disclosureAudience: ["public", "borrower", "lender", "sponsor"],
      sharingPermissions: ["public-safe-source-intelligence-read"],
      aiUsagePermissions: ["summarize", "classify"],
      exportRestrictions: [
        "advisory-only",
        "no-official-report-publication",
        "no-public-verification-claim",
        "no-production-reliance",
        "no-live-external-fetch",
      ],
      redactionRequirements: [
        "remove-direct-record-identifiers",
        "remove-credentials",
        "remove-raw-source-payloads",
      ],
    });

    const observability = createObservabilityEvent({
      eventType: "PUBLIC_SOURCE_INTELLIGENCE_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Public source intelligence route returned governed advisory DTO metadata.",
      traceId,
      replayRef: traceId,
      module: `api.public.${kind}`,
      metadata: {
        kind,
        route,
        itemCount: payload.items.length,
        claimsOk: claimsEvaluation.ok,
        redacted,
      },
    });

    return NextResponse.json({
      ok: true,
      data: classifiedPayload,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        claimsEvaluation,
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
            : "Unknown public source intelligence runtime error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
