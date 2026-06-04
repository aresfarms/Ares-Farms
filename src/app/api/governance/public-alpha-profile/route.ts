import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  PUBLIC_ALPHA_DEFINITION_VERSION,
  PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
  PublicAlphaProfileInput,
  composePublicAlphaProfile,
} from "@/lib/public-alpha/publicAlphaProfileRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = PublicAlphaProfileInput;

function createTraceId(): string {
  return `public-alpha-profile-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.public.alpha.profile.evaluate",
      module: "api.governance.public-alpha-profile",
      traceId,
      schemaVersion: "public-alpha-profile-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/public-alpha-profile",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "PUBLIC_ALPHA_PROFILE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Public Alpha Profile runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.public-alpha-profile",
        metadata: { route: "/api/governance/public-alpha-profile", findings: runtimeGuard.findings },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/governance/public-alpha-profile", runtimeBlocked: true },
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked Public Alpha Profile request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.public.alpha.profile.evaluate",
      module: "api.governance.public-alpha-profile",
      traceId,
      versions: [
        createRuntimeVersionRef("schema", "public-alpha-profile-request-v0.1.0", "src/app/api/governance/public-alpha-profile/route.ts", traceId),
        createRuntimeVersionRef("governance", "master-volumes-runtime-v0.1.0", "Master Volume Series", traceId),
        createRuntimeVersionRef("governance", PUBLIC_ALPHA_DEFINITION_VERSION, "docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md", traceId),
        createRuntimeVersionRef("runtime", "runtime-enforcement-v0.1.0", "src/lib/runtime", traceId),
        createRuntimeVersionRef("rules", PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION, "src/lib/public-alpha/publicAlphaProfileRuntime.ts", traceId),
        createRuntimeVersionRef("rules", "build-self-report-runtime-v0.1.0", "src/lib/build-self-report/buildSelfReportRuntime.ts", traceId),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-public-alpha-profile-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["authorized-operator", "governance", "auditor", "regulator"],
      sharingPermissions: ["regulated-operational-review", "governance-evidence-review"],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-an-alpha-entry-authorization",
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
      redactionRequirements: ["redact-internal-review-notes-before-public-disclosure"],
      consentRequirements: ["governance-public-alpha-profile-review-consent"],
    });

    const result = composePublicAlphaProfile(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.public.alpha.profile.evaluated",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource: "api-governance-public-alpha-profile-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["authorized-operator", "governance", "auditor", "regulator"],
        sharingPermissions: ["regulated-operational-review", "governance-evidence-review"],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-alpha-entry-authorization",
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
        redactionRequirements: ["redact-internal-review-notes-before-public-disclosure"],
        consentRequirements: ["governance-public-alpha-profile-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "public_alpha_profile_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Public Alpha Profile v1 pack composed as advisory audit posture against the Furlong Public Alpha Definition v1.0. The runtime does NOT authorize Alpha entry; the named governance authority records that decision externally. Internal advisory audit posture only.",
      ruleVersion: PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(0.85, Math.max(0.45, 0.45 + result.summary.v1OverallReadinessPercent / 200)),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        definitionVersion: result.definitionVersion,
        alphaEntryAllowed: result.alphaEntryAllowed,
        onCapabilitiesPass: result.summary.onCapabilitiesPass,
        offCapabilitiesPassOrBlockedByDesign: result.summary.offCapabilitiesPassOrBlockedByDesign,
        entryCriteriaPass: result.summary.entryCriteriaPass,
        openDecisionsRecorded: result.summary.openDecisionsRecorded,
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
      eventType: "PUBLIC_ALPHA_PROFILE_EVALUATED",
      domain: "operations",
      severity: result.alphaEntryAllowed === "PASS" ? "INFO" : "WARN",
      message: "Public Alpha Profile v1 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.public-alpha-profile",
      metadata: {
        route: "/api/governance/public-alpha-profile",
        alphaEntryAllowed: result.alphaEntryAllowed,
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
          resourceType: "public_alpha_profile_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: { route: "/api/governance/public-alpha-profile", stage: "input", applicationId: body.applicationId ?? null },
        },
        {
          resourceType: "public_alpha_profile_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/public-alpha-profile",
            stage: "output",
            advisoryOnly: true,
            noAlphaEntryAuthorization: true,
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
        targetType: "public_alpha_profile_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: PUBLIC_ALPHA_PROFILE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          alphaEntryAllowed: result.alphaEntryAllowed,
          findingCount: result.summary.findingCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/public-alpha-profile",
          operation: "governance.public.alpha.profile.evaluate",
        },
      },
      metadata: {
        route: "/api/governance/public-alpha-profile",
        operation: "governance.public.alpha.profile.evaluate",
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
      eventType: "PUBLIC_ALPHA_PROFILE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Public Alpha Profile API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.public-alpha-profile",
      metadata: {
        route: "/api/governance/public-alpha-profile",
        error: error instanceof Error ? error.message : "Unknown Public Alpha Profile runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: { route: "/api/governance/public-alpha-profile", runtimeError: true },
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Public Alpha Profile runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
