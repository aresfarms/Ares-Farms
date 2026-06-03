import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  REGISTRY_FRAMEWORK_RUNTIME_VERSION,
  RegistryFrameworkInput,
  evaluateRegistryFramework,
} from "@/lib/registry/frameworkRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Registry Framework API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over the registry catalogs.
 * - Vol II: prevents catalogs from becoming external promotion, public
 *   verification, regulatory reliance, lender commitment, or legal
 *   reliance.
 * - Vol III: provides deterministic, replay-safe composition over the
 *   canonical module manifest registry, event contract registry, handoff
 *   map, public surface gateway, source authority registry, controlled
 *   promotion gates, and participant role registry.
 * - Vol III-B: attaches runtime guard, classification (RESTRICTED), version
 *   lineage, observability, explainability, replay verification, and
 *   audit-safe error envelope.
 * - Vol IV: routes catalog handoffs to the Governance Evidence Engine,
 *   Internal Certification Engine, Module 16 Evidence Packet Workspace,
 *   Module Readiness Control Tower, Audit Replay Console, Governance,
 *   and Reviews.
 * - Vol V-VII: enforces canonical claims governance, controlled disclosure,
 *   replay, audit, portability, source authority, and conformance on every
 *   composed catalog.
 */

type RegistryFrameworkRequest = RegistryFrameworkInput;

function createRegistryFrameworkTraceId(): string {
  return `registry-framework-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createRegistryFrameworkTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as RegistryFrameworkRequest;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.registry.framework.compose",
      module: "api.governance.registry-framework",
      traceId,
      schemaVersion: "registry-framework-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/registry-framework",
        audience: body.scope?.audience ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REGISTRY_FRAMEWORK_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Registry framework runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.registry-framework",
        metadata: {
          route: "/api/governance/registry-framework",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/registry-framework",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked registry framework request.",
          governance: {
            traceId,
            runtimeGuard,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.registry.framework.compose",
      module: "api.governance.registry-framework",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "registry-framework-request-v0.1.0",
          "src/app/api/governance/registry-framework/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          REGISTRY_FRAMEWORK_RUNTIME_VERSION,
          "src/lib/registry/frameworkRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-registry-framework-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "governance",
        "auditor",
        "regulator",
      ],
      sharingPermissions: [
        "regulated-operational-review",
        "governance-evidence-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-an-external-promotion",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-lender-commitment",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-application-content-before-external-disclosure",
      ],
      consentRequirements: ["governance-registry-review-consent"],
    });

    const frameworkResult = evaluateRegistryFramework(body);

    const classifiedOutput = classifyRecord(
      {
        frameworkResult,
        event: {
          eventType: "governance.registry.framework.composed",
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-registry-framework-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "governance",
          "auditor",
          "regulator",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "governance-evidence-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-external-promotion",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-an-environmental-determination",
          "not-a-payment-authorization",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["governance-registry-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "internal_registry_framework",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Registry framework composed as review-bound internal catalog evidence only. No external promotion, public verification, regulatory reliance, lender commitment, or legal reliance is created.",
      ruleVersion: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.9,
        Math.max(0.5, 0.5 + frameworkResult.summary.catalogCount / 30)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        catalogCount: frameworkResult.summary.catalogCount,
        totalEntryCount: frameworkResult.summary.totalEntryCount,
        internalRegistryOnly: frameworkResult.internalRegistryOnly,
        productionBlocked: frameworkResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "REGISTRY_FRAMEWORK_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Registry framework composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.registry-framework",
      metadata: {
        route: "/api/governance/registry-framework",
        catalogCount: frameworkResult.summary.catalogCount,
        totalEntryCount: frameworkResult.summary.totalEntryCount,
        publicSurfaceEntryCount:
          frameworkResult.summary.publicSurfaceEntryCount,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "registry_framework_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/registry-framework",
            stage: "input",
            audience: body.scope?.audience ?? null,
          },
        },
        {
          resourceType: "registry_framework_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/registry-framework",
            stage: "output",
            internalRegistryOnly: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "internal_registry_framework",
        targetId: traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: REGISTRY_FRAMEWORK_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          catalogCount: frameworkResult.summary.catalogCount,
          totalEntryCount: frameworkResult.summary.totalEntryCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/registry-framework",
          operation: "governance.registry.framework.compose",
        },
      },
      metadata: {
        route: "/api/governance/registry-framework",
        operation: "governance.registry.framework.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      frameworkResult,
      event: classifiedOutput.event,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "REGISTRY_FRAMEWORK_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Registry framework API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.registry-framework",
      metadata: {
        route: "/api/governance/registry-framework",
        error:
          error instanceof Error
            ? error.message
            : "Unknown registry framework runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/registry-framework",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown registry framework runtime error.",
        governance: {
          traceId,
          observability,
          evidence,
        },
      },
      { status: 500 }
    );
  }
}
