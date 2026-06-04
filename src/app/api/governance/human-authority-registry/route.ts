import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  HUMAN_AUTHORITY_REGISTRY_DOC_REF,
  HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
  HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
  HumanAuthorityRegistryInput,
  composeHumanAuthorityRegistry,
} from "@/lib/human-authority/humanAuthorityRegistryRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = HumanAuthorityRegistryInput;

function createTraceId(): string {
  return `human-authority-registry-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.human.authority.registry.evaluate",
      module: "api.governance.human-authority-registry",
      traceId,
      schemaVersion: "human-authority-registry-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/human-authority-registry",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "HUMAN_AUTHORITY_REGISTRY_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Human Authority Registry runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.human-authority-registry",
        metadata: {
          route: "/api/governance/human-authority-registry",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/human-authority-registry",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Human Authority Registry request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.human.authority.registry.evaluate",
      module: "api.governance.human-authority-registry",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "human-authority-registry-request-v0.1.0",
          "src/app/api/governance/human-authority-registry/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          HUMAN_AUTHORITY_REGISTRY_SPEC_VERSION,
          HUMAN_AUTHORITY_REGISTRY_DOC_REF,
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
          HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
          "src/lib/human-authority/humanAuthorityRegistryRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-human-authority-registry-route",
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
        "not-an-authority-assignment",
        "not-an-ai-clearing",
        "not-a-self-clear",
        "not-an-information-sale",
        "not-a-silent-submission",
        "not-an-approval",
        "not-a-denial",
        "not-a-lender-commitment",
        "not-an-agency-decision",
        "not-an-official-certification",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-legal-reliance",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "not-a-notice-send",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-internal-review-notes-before-public-disclosure",
      ],
      consentRequirements: [
        "governance-human-authority-registry-review-consent",
      ],
    });

    const result = composeHumanAuthorityRegistry(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.human.authority.registry.verified",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-human-authority-registry-route-output",
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
          "not-an-authority-assignment",
          "not-an-ai-clearing",
          "not-a-self-clear",
          "not-an-information-sale",
          "not-a-silent-submission",
          "not-an-approval",
          "not-a-denial",
          "not-a-lender-commitment",
          "not-an-agency-decision",
          "not-an-official-certification",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-legal-reliance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-notice-send",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: [
          "governance-human-authority-registry-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "human_authority_registry_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Human Authority Registry v1 pack composed as advisory audit posture against the Module 45 Human Authority Registry Specification. The runtime does NOT authorize any action; it declares who is permitted to clear what and enforces that no one else (and no AI) can. Internal advisory audit posture only.",
      ruleVersion: HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + result.summary.v1OverallReadinessPercent / 200)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        specVersion: result.specVersion,
        docRef: result.docRef,
        bindingCount: result.summary.bindingCount,
        rolesDeclared: result.summary.rolesDeclared,
        rolesFilled: result.summary.rolesFilled,
        modulesAlphaRequired: result.summary.modulesAlphaRequired,
        modulesIntentionallyHeld: result.summary.modulesIntentionallyHeld,
        modulesAuthorityPass: result.summary.modulesAuthorityPass,
        modulesAuthorityFail: result.summary.modulesAuthorityFail,
        coverageMissingCount: result.summary.coverageMissingCount,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        replaySafe: result.replaySafe,
        auditSafe: result.auditSafe,
        conflictPreserving: result.conflictPreserving,
        federationScoped: result.federationScoped,
        productionBlocked: result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "HUMAN_AUTHORITY_REGISTRY_EVALUATED",
      domain: "operations",
      severity: result.exitCode === 0 ? "INFO" : "WARN",
      message:
        "Human Authority Registry v1 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.human-authority-registry",
      metadata: {
        route: "/api/governance/human-authority-registry",
        exitCode: result.exitCode,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel: classifiedOutput.classification.classificationLevel,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "human_authority_registry_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/human-authority-registry",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "human_authority_registry_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/human-authority-registry",
            stage: "output",
            advisoryOnly: true,
            noAuthorityAssignment: true,
            noAiClearing: true,
            noSelfClear: true,
            replaySafe: true,
            auditSafe: true,
            conflictPreserving: true,
            federationScoped: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "human_authority_registry_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: HUMAN_AUTHORITY_REGISTRY_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          exitCode: result.exitCode,
          findingCount: result.summary.findingCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/human-authority-registry",
          operation: "governance.human.authority.registry.evaluate",
        },
      },
      metadata: {
        route: "/api/governance/human-authority-registry",
        operation: "governance.human.authority.registry.evaluate",
      },
    });

    return NextResponse.json({
      ok: true,
      result,
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
      eventType: "HUMAN_AUTHORITY_REGISTRY_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Human Authority Registry API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.human-authority-registry",
      metadata: {
        route: "/api/governance/human-authority-registry",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Human Authority Registry runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/human-authority-registry",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Human Authority Registry runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
