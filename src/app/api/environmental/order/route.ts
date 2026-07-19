import { NextRequest, NextResponse } from "next/server";

import {
  ENVIRONMENTAL_ORDER_RUNTIME_VERSION,
  EnvironmentalOrderInput,
  evaluateEnvironmentalOrder,
} from "@/lib/environmental/orderRuntime";
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

/**
 * Environmental Service Order API (customer orders a Phase I/II/III or PE review)
 *
 * Master Volume Governance:
 * - Vol I (FACILITATION-001 §3.32): records + routes an order to the licensed
 *   Environmental Engineering Spoke (PE); never a determination or clearance.
 * - Vol II (REG-NEPA-001 / USDA-ENV-001 §3.21): environmental order lineage is
 *   immutable, classification-aware, and replay-safe; the PE and agency are the
 *   determining authorities. Section 1071 firewall: no demographic data.
 * - Vol III-B (GOV-RUNTIME-001 §3.49, HITL-GOV-001 §3.51): full runtime
 *   substrate on every request — runtime guard, version lineage, classification
 *   (RESTRICTED), explainability, observability, replay verification, persisted
 *   governance evidence, audit-safe error envelope. Human review required.
 * - Vol V (CANON-TREASURY-001 §9.1): fee disclosed at intake; the durable
 *   service-request row records the fee-disclosure + consent acknowledgements.
 *   (CANON-CONSENT-001 §6): consent recorded before the order is acted on.
 *
 * Payment posture: this route creates the governed ORDER; the fee is disclosed
 * and quoted, and the customer approves the quote before any work or charge.
 * Live payment capture remains gated behind the treasury-ledger spine
 * (REG-TREASURY-001 + REPLAY-CERTIFICATION-001) and is not enabled here.
 */

type EnvironmentalOrderRequest = EnvironmentalOrderInput & {
  userId?: string | null;
};

function createEnvironmentalOrderTraceId(): string {
  return `environmental-order-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function serviceRequestReference(traceId: string): string {
  return `ENV-${traceId.slice(-12).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const traceId = createEnvironmentalOrderTraceId();

  try {
    const body = (await req.json()) as EnvironmentalOrderRequest;
    const actorId = body.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "customer.environmental.order.submit",
      module: "api.environmental.order",
      traceId,
      schemaVersion: "environmental-order-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/environmental/order",
        licensedModule: "environmental-engineering-spoke",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "ENVIRONMENTAL_ORDER_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Environmental order runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.environmental.order",
        metadata: {
          route: "/api/environmental/order",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: { route: "/api/environmental/order", runtimeBlocked: true },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked environmental order request.",
          governance: { traceId, runtimeGuard, observability, evidence },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "customer.environmental.order.submit",
      module: "api.environmental.order",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "environmental-order-request-v0.1.0",
          "src/app/api/environmental/order/route.ts",
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
          ENVIRONMENTAL_ORDER_RUNTIME_VERSION,
          "src/lib/environmental/orderRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "borrower",
      classificationSource: "api-environmental-order-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "customer",
        "authorized-operator",
        "environmental-engineering-spoke",
        "governance",
      ],
      sharingPermissions: [
        "environmental-spoke-fulfillment",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["classify", "route"],
      exportRestrictions: [
        "requires-governed-access",
        "not-an-environmental-determination",
        "not-a-clearance",
        "not-a-permit",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-contact-pii-before-external-disclosure",
      ],
      consentRequirements: ["environmental-order-routing-consent"],
    });

    const orderResult = evaluateEnvironmentalOrder(body);
    const serviceRequestId = serviceRequestReference(traceId);

    const classifiedOutput = classifyRecord(
      {
        orderResult,
        event: {
          eventType: "customer.environmental.order.submitted",
          serviceRequestId,
          applicationId: body.applicationId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "borrower",
        classificationSource: "api-environmental-order-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "customer",
          "authorized-operator",
          "environmental-engineering-spoke",
          "governance",
        ],
        sharingPermissions: [
          "environmental-spoke-fulfillment",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-environmental-determination",
          "not-a-clearance",
          "not-a-permit",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["environmental-order-routing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "customer_environmental_order",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Customer environmental service order recorded and routed to the licensed PE. No environmental determination, clearance, or permit is created; the fee is quoted and approved before any work.",
      ruleVersion: ENVIRONMENTAL_ORDER_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.95,
        Math.max(0.4, orderResult.readiness.readinessPercent / 100)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        serviceCode: orderResult.service?.code ?? null,
        routedTo: orderResult.routedTo,
        readinessPercent: orderResult.readiness.readinessPercent,
        determinationIssued: orderResult.determinationIssued,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "ENVIRONMENTAL_ORDER_RECORDED",
      domain: "operations",
      severity: "INFO",
      message: "Customer environmental order routed to the licensed PE spoke.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.environmental.order",
      metadata: {
        route: "/api/environmental/order",
        serviceRequestId,
        serviceCode: orderResult.service?.code ?? null,
        readinessPercent: orderResult.readiness.readinessPercent,
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
          resourceType: "environmental_order_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/environmental/order",
            stage: "input",
            serviceRequestId,
          },
        },
        {
          resourceType: "environmental_order_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/environmental/order",
            stage: "output",
            determinationIssued: false,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "customer_environmental_order",
        targetId: serviceRequestId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: ENVIRONMENTAL_ORDER_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          serviceCode: orderResult.service?.code ?? null,
          readinessPercent: orderResult.readiness.readinessPercent,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/environmental/order",
          operation: "customer.environmental.order.submit",
        },
      },
      metadata: {
        route: "/api/environmental/order",
        operation: "customer.environmental.order.submit",
      },
    });

    const serviceRequest = await persistServiceRequest({
      traceId,
      serviceRequestId,
      requestType: "environmental_report_order",
      serviceCode: orderResult.service?.code ?? null,
      routedTo: orderResult.routedTo,
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
        typeof body.estimatedValue === "number" ? body.estimatedValue : null,
      feeDisclosureAcknowledged: Boolean(body.feeDisclosureAcknowledged),
      consentAcknowledged: Boolean(body.consentAcknowledged),
      humanReviewRequired: true,
      metadata: {
        route: "/api/environmental/order",
        timeline: body.timeline ?? null,
        readinessPercent: orderResult.readiness.readinessPercent,
      },
    });

    return NextResponse.json({
      ok: true,
      serviceRequestId,
      status: serviceRequest.status,
      orderResult,
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
      eventType: "ENVIRONMENTAL_ORDER_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Environmental order API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.environmental.order",
      metadata: {
        route: "/api/environmental/order",
        error:
          error instanceof Error
            ? error.message
            : "Unknown environmental order runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: { route: "/api/environmental/order", runtimeError: true },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown environmental order runtime error.",
        governance: { traceId, observability, evidence },
      },
      { status: 500 }
    );
  }
}
