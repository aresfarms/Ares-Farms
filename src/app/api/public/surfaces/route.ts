import { NextResponse } from "next/server";

import {
  buildPublicSurfaceGatewayPayload,
  publicGatewayPayloadIsRedacted,
} from "@/lib/dto/public";
import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Public Surface Gateway
 *
 * Master Volume Governance:
 * - Vol I: keeps public translation surfaces subordinate to constitutional
 *   authority.
 * - Vol II: blocks public reliance, eligibility, approval, official report,
 *   notice, payment, and external-source overclaims.
 * - Vol III: routes public-safe reads through the governed backend runtime
 *   spine rather than raw records.
 * - Vol III-B: attaches classification, versioning, observability, and claims
 *   evidence to public-safe response formatting.
 * - Vol IV: supports deployment gates, operator review, and activation
 *   runbooks.
 * - Vol V: enforces controlled disclosure, redaction, content claims,
 *   replayability, portability, and source-authority limits.
 * - Vol VI: governs public surfaces as DTO-backed translation layers with
 *   source-intelligence, module-readiness, conformance, and production-block
 *   posture.
 *
 * Supplemental integration sources:
 * - Ares_Furlong_Module_Integration_Expansion_Requirements.docx
 * - Ares_Furlong_Platform_Integration_Architecture.docx
 * - Furlong_Volume_VI_Source_Intelligence_Integration_Master.pdf
 */

function createPublicGatewayTraceId(): string {
  return `public-surfaces-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  const traceId = createPublicGatewayTraceId();

  try {
    const runtimeGuard = runRuntimeGuard({
      operation: "public.surface.read",
      module: "api.public.surfaces",
      traceId,
      schemaVersion: "public-surface-gateway-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "PUBLIC",
      replayRef: traceId,
      metadata: {
        route: "/api/public/surfaces",
        classificationFiltering: true,
        claimsGovernance: true,
        audiencePermissions: true,
        redactionRules: true,
        auditLogging: true,
        rateLimitingRequired: true,
        publicSafeFormatting: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked public surface gateway.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "public.surface.read",
      module: "api.public.surfaces",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "public-surface-gateway-v0.1.0",
          "src/app/api/public/surfaces/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series + Module Integration Expansion Requirements",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "public-surface-gateway-v0.1.0",
          "api.public.surfaces",
          traceId
        ),
      ],
    });

    const payload = buildPublicSurfaceGatewayPayload();
    const redacted = publicGatewayPayloadIsRedacted(payload);
    const claimsEvaluation = evaluateContentClaims({
      text: [
        ...payload.surfaces.map((surface) =>
          [
            surface.title,
            surface.route,
            surface.claimsProfile,
            ...surface.statusMessages,
          ].join(" ")
        ),
        ...payload.productionBlocks,
      ],
      context: {
        publicVerificationGatewayOperational: false,
        canonicalHashVerificationOperational: false,
        officialDecisionAuthority: false,
      },
    });

    if (!redacted || !claimsEvaluation.ok) {
      const observability = createObservabilityEvent({
        eventType: "PUBLIC_SURFACE_GATEWAY_BLOCKED",
        domain: "security",
        severity: "ERROR",
        message:
          "Public surface gateway blocked response because redaction or content claims failed.",
        traceId,
        replayRef: traceId,
        module: "api.public.surfaces",
        metadata: {
          redacted,
          blockCount: claimsEvaluation.blockCount,
          reviewCount: claimsEvaluation.reviewCount,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Public-safe response governance failed.",
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
      classificationSource: "api-public-surfaces",
      classificationVersion: "public-surface-gateway-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["public", "borrower", "lender", "sponsor"],
      sharingPermissions: ["public-safe-status-read"],
      aiUsagePermissions: ["summarize", "classify"],
      exportRestrictions: [
        "no-official-report-publication",
        "no-public-verification-claim",
        "no-production-reliance",
      ],
      redactionRequirements: [
        "remove-direct-record-identifiers",
        "remove-permissions-and-backend-dependencies",
      ],
    });

    const observability = createObservabilityEvent({
      eventType: "PUBLIC_SURFACE_GATEWAY_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Public-safe surface gateway returned redacted translation-layer metadata.",
      traceId,
      replayRef: traceId,
      module: "api.public.surfaces",
      metadata: {
        surfaceCount: payload.surfaces.length,
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
            : "Unknown public surface gateway error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
