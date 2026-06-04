import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
  PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
  CustomerJourneyInput,
  composePublicAlphaCustomerJourney,
} from "@/lib/public-alpha-journey/publicAlphaCustomerJourneyRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

type Request = CustomerJourneyInput;

function createTraceId(): string {
  return `public-alpha-customer-journey-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId();
  try {
    const body = (await req.json().catch(() => ({}))) as Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;
    const runtimeGuard = runRuntimeGuard({
      operation: "governance.public.alpha.customer.journey.audit",
      module: "api.governance.public-alpha-customer-journey",
      traceId,
      schemaVersion: "public-alpha-customer-journey-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/public-alpha-customer-journey",
        applicationId: body.applicationId ?? null,
      },
    });
    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Public Alpha Customer Journey runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.public-alpha-customer-journey",
        metadata: {
          route: "/api/governance/public-alpha-customer-journey",
          findings: runtimeGuard.findings,
        },
      });
      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/public-alpha-customer-journey",
          runtimeBlocked: true,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Public Alpha Customer Journey request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.public.alpha.customer.journey.audit",
      module: "api.governance.public-alpha-customer-journey",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "public-alpha-customer-journey-request-v0.1.0",
          "src/app/api/governance/public-alpha-customer-journey/route.ts",
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
          PUBLIC_ALPHA_CUSTOMER_JOURNEY_SPEC_VERSION,
          PUBLIC_ALPHA_CUSTOMER_JOURNEY_DOC_REF,
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
          PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
          "src/lib/public-alpha-journey/publicAlphaCustomerJourneyRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-public-alpha-customer-journey-route",
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
        "not-an-alpha-entry-authorization",
        "not-a-customer-facing-publication",
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
        "governance-public-alpha-customer-journey-review-consent",
      ],
    });

    const result = composePublicAlphaCustomerJourney(body);

    const classifiedOutput = classifyRecord(
      {
        result,
        event: {
          eventType: "governance.public.alpha.customer.journey.audited",
          applicationId: result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-public-alpha-customer-journey-route-output",
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
          "not-an-alpha-entry-authorization",
          "not-a-customer-facing-publication",
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
          "governance-public-alpha-customer-journey-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "public_alpha_customer_journey_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Public Alpha Customer Journey v1 audit pack composed against the Public Alpha Profile v1 doctrine. The runtime audits the 7 entry-surface sections, 6 customer success questions, customer promise, financing reality classifications, disclosure coverage, and escalation authority bindings. It does NOT authorize Public Alpha entry; the named governance authority records that decision externally.",
      ruleVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(
          0.45,
          0.45 + result.summary.v1OverallReadinessPercent / 200
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        specVersion: result.specVersion,
        docRef: result.docRef,
        sectionCount: result.summary.sectionCount,
        sectionsPass: result.summary.sectionsPass,
        sectionsFail: result.summary.sectionsFail,
        customerSuccessQuestionsPass:
          result.summary.customerSuccessQuestionsPass,
        customerSuccessQuestionsFail:
          result.summary.customerSuccessQuestionsFail,
        customerPromiseStatus: result.summary.customerPromiseStatus,
        financingRealityStatus: result.summary.financingRealityStatus,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
        alphaJourneyReady: result.alphaJourneyReady,
        replaySafe: result.replaySafe,
        auditSafe: result.auditSafe,
        conflictPreserving: result.conflictPreserving,
        federationScoped: result.federationScoped,
        productionBlocked: result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "PUBLIC_ALPHA_CUSTOMER_JOURNEY_AUDITED",
      domain: "operations",
      severity: result.exitCode === 0 ? "INFO" : "WARN",
      message:
        "Public Alpha Customer Journey v1 audit composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.public-alpha-customer-journey",
      metadata: {
        route: "/api/governance/public-alpha-customer-journey",
        alphaJourneyReady: result.alphaJourneyReady,
        exitCode: result.exitCode,
        findingCount: result.summary.findingCount,
        crossSourceConflictCount: result.summary.crossSourceConflictCount,
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
          resourceType: "public_alpha_customer_journey_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/public-alpha-customer-journey",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "public_alpha_customer_journey_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/public-alpha-customer-journey",
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
        targetType: "public_alpha_customer_journey_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: PUBLIC_ALPHA_CUSTOMER_JOURNEY_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          alphaJourneyReady: result.alphaJourneyReady,
          exitCode: result.exitCode,
          findingCount: result.summary.findingCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/public-alpha-customer-journey",
          operation: "governance.public.alpha.customer.journey.audit",
        },
      },
      metadata: {
        route: "/api/governance/public-alpha-customer-journey",
        operation: "governance.public.alpha.customer.journey.audit",
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
      eventType: "PUBLIC_ALPHA_CUSTOMER_JOURNEY_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Public Alpha Customer Journey API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.public-alpha-customer-journey",
      metadata: {
        route: "/api/governance/public-alpha-customer-journey",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Public Alpha Customer Journey runtime error.",
      },
    });
    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/public-alpha-customer-journey",
        runtimeError: true,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Public Alpha Customer Journey runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
