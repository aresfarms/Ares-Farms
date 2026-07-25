import { NextRequest, NextResponse } from "next/server";

import {
  FINANCING_INTAKE_RUNTIME_VERSION,
  FinancingIntakeInput,
  evaluateFinancingIntake,
} from "@/lib/financing/intakeRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { persistServiceRequest } from "@/lib/serviceRequests/serviceRequestStore";
import { notifyOnServiceRequest } from "@/lib/notifications/notificationDispatch";
import { captureGeneratedEvidenceArtifact } from "@/lib/property/officialEvidenceGenerationCapture";

/**
 * Financing Deal Intake API (customer submits a deal → licensed lender)
 *
 * Master Volume Governance:
 * - Vol I (CONST-PATHWAY-001 / FACILITATION-001 §3.32): records + routes a deal
 *   to the licensed lending spoke (Stuart); the platform facilitates, it does
 *   not decide, qualify, price, or approve.
 * - Vol II (Section 1071 firewall §3.20): NO demographic data. (CONST-FAIR-001/
 *   002): no adverse-action or qualification determination is made here.
 * - Vol III-B (GOV-RUNTIME-001 §3.49, HITL-GOV-001 §3.51): full runtime
 *   substrate on every request — runtime guard, version lineage, classification
 *   (RESTRICTED), explainability, observability, replay verification, persisted
 *   governance evidence, audit-safe error envelope. Human review required (the
 *   licensed lender is the reviewer of record).
 * - Vol V (CANON-TREASURY-001 §9.1): fee posture disclosed at intake. Bright
 *   line: Furlong takes NO transaction-tied compensation (build-spec doctrine).
 *
 * Payment posture: submitting a deal is free; there is no charge on this route.
 * Loan costs are the lender's and are disclosed at closing. Live payment
 * capture across the platform stays gated behind the treasury-ledger spine
 * (REG-TREASURY-001 + REPLAY-CERTIFICATION-001).
 */

type FinancingIntakeRequest = FinancingIntakeInput & {
  userId?: string | null;
};

function createFinancingIntakeTraceId(): string {
  return `financing-intake-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function serviceRequestReference(traceId: string): string {
  return `FIN-${traceId.slice(-12).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const traceId = createFinancingIntakeTraceId();

  try {
    const body = (await req.json()) as FinancingIntakeRequest;
    const actorId = body.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "customer.financing.intake.submit",
      module: "api.financing.intake",
      traceId,
      schemaVersion: "financing-intake-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/financing/intake",
        licensedModule: "licensed-lending-spoke",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "FINANCING_INTAKE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Financing intake runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.financing.intake",
        metadata: {
          route: "/api/financing/intake",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/financing/intake", runtimeBlocked: true },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked financing intake request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "customer.financing.intake.submit",
      module: "api.financing.intake",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "financing-intake-request-v0.1.0",
          "src/app/api/financing/intake/route.ts",
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
          FINANCING_INTAKE_RUNTIME_VERSION,
          "src/lib/financing/intakeRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "borrower",
      classificationSource: "api-financing-intake-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "borrower",
        "authorized-operator",
        "licensed-lending-spoke",
        "governance",
      ],
      sharingPermissions: [
        "licensed-lending-fulfillment",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["classify", "route"],
      exportRestrictions: [
        "requires-governed-access",
        "not-a-credit-decision",
        "not-a-qualification",
        "not-a-pre-approval",
        "no-demographic-data",
        "requires-human-review",
      ],
      redactionRequirements: ["redact-contact-pii-before-external-disclosure"],
      consentRequirements: ["financing-intake-routing-consent"],
    });

    const intakeResult = evaluateFinancingIntake(body);
    const lineagePropertyId = body.applicationId?.trim() || body.propertyDescriptor?.trim() || `financing-intake:${traceId}`;
    captureGeneratedEvidenceArtifact({
      kind: "qualification-result",
      propertyId: lineagePropertyId,
      artifactId: `qualification-result:${lineagePropertyId}`,
      generatedAt: intakeResult.generatedAt,
      replayInput: body,
      replayOutput: intakeResult,
    });
    const serviceRequestId = serviceRequestReference(traceId);

    const classifiedOutput = classifyRecord(
      {
        intakeResult,
        event: {
          eventType: "customer.financing.intake.submitted",
          serviceRequestId,
          applicationId: body.applicationId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "borrower",
        classificationSource: "api-financing-intake-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-operator",
          "licensed-lending-spoke",
          "governance",
        ],
        sharingPermissions: [
          "licensed-lending-fulfillment",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-credit-decision",
          "not-a-qualification",
          "not-a-pre-approval",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["financing-intake-routing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "customer_financing_intake",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Customer financing deal recorded and routed to the licensed lender. No qualification, pre-approval, pricing, or credit decision is made; the lender decides.",
      ruleVersion: FINANCING_INTAKE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.95,
        Math.max(0.4, intakeResult.readiness.readinessPercent / 100)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        purpose: intakeResult.purpose?.code ?? null,
        programInterest: intakeResult.programInterest?.code ?? null,
        routedTo: intakeResult.routedTo,
        readinessPercent: intakeResult.readiness.readinessPercent,
        qualificationDetermined: intakeResult.qualificationDetermined,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "FINANCING_INTAKE_RECORDED",
      domain: "operations",
      severity: "INFO",
      message: "Customer financing deal routed to the licensed lending spoke.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.financing.intake",
      metadata: {
        route: "/api/financing/intake",
        serviceRequestId,
        purpose: intakeResult.purpose?.code ?? null,
        readinessPercent: intakeResult.readiness.readinessPercent,
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
          resourceType: "financing_intake_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/financing/intake",
            stage: "input",
            serviceRequestId,
          },
        },
        {
          resourceType: "financing_intake_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/financing/intake",
            stage: "output",
            qualificationDetermined: false,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "customer_financing_intake",
        targetId: serviceRequestId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: FINANCING_INTAKE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          purpose: intakeResult.purpose?.code ?? null,
          readinessPercent: intakeResult.readiness.readinessPercent,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/financing/intake",
          operation: "customer.financing.intake.submit",
        },
      },
      metadata: {
        route: "/api/financing/intake",
        operation: "customer.financing.intake.submit",
      },
    });

    const serviceRequest = await persistServiceRequest({
      traceId,
      serviceRequestId,
      requestType: "financing_deal_intake",
      serviceCode: intakeResult.programInterest?.code ?? null,
      routedTo: intakeResult.routedTo,
      tenantId: body.tenantId ?? null,
      actorId,
      userId: body.userId ?? null,
      applicationId: body.applicationId ?? null,
      contactName: body.contactName ?? null,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      propertyDescriptor: body.propertyDescriptor ?? null,
      locationState: body.location?.state ?? null,
      locationCounty: body.location?.county ?? null,
      scopeSummary: body.scopeSummary ?? null,
      estimatedValue:
        typeof body.estimatedProjectCost === "number"
          ? body.estimatedProjectCost
          : null,
      feeDisclosureAcknowledged: Boolean(body.feeDisclosureAcknowledged),
      consentAcknowledged: Boolean(body.consentAcknowledged),
      humanReviewRequired: true,
      metadata: {
        route: "/api/financing/intake",
        purpose: intakeResult.purpose?.code ?? null,
        contactAddress: body.contactAddress ?? null,
        timeline: body.timeline ?? null,
        readinessPercent: intakeResult.readiness.readinessPercent,
      },
    });

    // Alert the licensed lender that a deal is waiting (min-disclosure, never blocks).
    await notifyOnServiceRequest({
      requestType: "financing_deal_intake",
      serviceRequestId,
      routedTo: intakeResult.routedTo,
      traceId,
    });

    return NextResponse.json({
      ok: true,
      serviceRequestId,
      status: serviceRequest.status,
      intakeResult,
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
      eventType: "FINANCING_INTAKE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Financing intake API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.financing.intake",
      metadata: {
        route: "/api/financing/intake",
        error:
          error instanceof Error
            ? error.message
            : "Unknown financing intake runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: { route: "/api/financing/intake", runtimeError: true },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown financing intake runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
