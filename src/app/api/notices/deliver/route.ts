import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistBorrowerNoticeDelivery } from "@/lib/notices/borrowerNoticeDeliveryStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Notice Delivery API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Requires accountable authority before borrower notice delivery.
 *
 * - Vol II: Regulatory Governance
 *   Preserves adverse-action, appeal, explanation, fair-lending, redaction,
 *   delivery tracking, retention, and borrower-disclosure boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Records replay-safe notice packet and delivery-state evidence without
 *   ungoverned external provider transmission.
 *
 * - Vol IV: Operational Runbooks
 *   Supports controlled notice preparation, delivery monitoring, dispute
 *   handling, recovery, escalation, and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, observability, replayability,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

type BorrowerNoticeDeliveryRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  decisionNoticeId?: string | null;
  noticeType?: string | null;
  deliveryChannel?: string | null;
  noticePacketRef?: string | null;
  redactionProfileRef?: string | null;
  redactionStatus?: string | null;
  appealPacketRef?: string | null;
  retentionPolicyRef?: string | null;
  deliveryTrackingRef?: string | null;
  deliveryProviderRef?: string | null;
  deliveryProviderConfigured?: boolean | null;
  metadata?: Record<string, unknown>;
};

function createNoticeDeliveryTraceId(): string {
  return `notice-delivery-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: BorrowerNoticeDeliveryRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: BorrowerNoticeDeliveryRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function deliveryResponse(
  delivery: Awaited<ReturnType<typeof persistBorrowerNoticeDelivery>>["delivery"]
) {
  return {
    id: delivery.id,
    decisionNoticeId: delivery.decisionNoticeId,
    applicationId: delivery.applicationId,
    borrowerId: delivery.borrowerId,
    tenantId: delivery.tenantId,
    noticeType: delivery.noticeType,
    deliveryChannel: delivery.deliveryChannel,
    deliveryStatus: delivery.deliveryStatus,
    noticePacketStatus: delivery.noticePacketStatus,
    redactionStatus: delivery.redactionStatus,
    appealPacketStatus: delivery.appealPacketStatus,
    retentionStatus: delivery.retentionStatus,
    noticePacketRef: delivery.noticePacketRef,
    deliveryTrackingRef: delivery.deliveryTrackingRef,
    deliveryAllowed: delivery.deliveryAllowed,
    borrowerDisclosureAllowed: delivery.borrowerDisclosureAllowed,
    externalDeliveryPerformed: delivery.externalDeliveryPerformed,
    deliveryProviderConfigured: delivery.deliveryProviderConfigured,
    appealRightsIncluded: delivery.appealRightsIncluded,
    redactionCompleted: delivery.redactionCompleted,
    retentionPolicyAttached: delivery.retentionPolicyAttached,
    deliveryPreparedAt: delivery.deliveryPreparedAt,
    externalDeliveredAt: delivery.externalDeliveredAt,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createNoticeDeliveryTraceId();

  try {
    const body = (await req.json()) as BorrowerNoticeDeliveryRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower-notice.deliver",
      module: "api.notices.deliver",
      traceId,
      schemaVersion: "borrower-notice-deliveries-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/notices/deliver",
        applicationId: body.applicationId ?? null,
        decisionNoticeId: body.decisionNoticeId ?? null,
        externalDeliveryExpected: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_DELIVERY_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Borrower notice delivery was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.deliver",
        metadata: {
          route: "/api/notices/deliver",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/deliver",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked borrower notice delivery.",
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

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "borrower-notice.deliver",
      module: "api.notices.deliver",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_DELIVERY_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice delivery was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.deliver",
        metadata: {
          route: "/api/notices/deliver",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/deliver",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for borrower notice delivery.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const recordAccess = await evaluateApplicationRecordAccess({
      access,
      operation: "borrower-notice.deliver",
      module: "api.notices.deliver",
      traceId,
      resourceType: "borrower_notice_delivery",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "BORROWER_NOTICE_DELIVERY_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Borrower notice delivery was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.notices.deliver",
        metadata: {
          route: "/api/notices/deliver",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/notices/deliver",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this borrower notice record.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "borrower-notice.deliver",
      module: "api.notices.deliver",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-delivery-api-v0.1.0",
          "src/app/api/notices/deliver/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "borrower-notice-deliveries-v0.1.0",
          "src/db/schema/borrowerNoticeDeliveries.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "regulated-decision-notices-v0.1.0",
          "src/db/schema/regulatedDecisionNotices.ts",
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
          "borrower-notice-delivery-runtime-v0.1.0",
          "src/lib/notices/borrowerNoticeDeliveryStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        decisionNoticeId: body.decisionNoticeId ?? null,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        noticeType: body.noticeType ?? null,
        deliveryChannel: body.deliveryChannel ?? null,
        redactionStatus: body.redactionStatus ?? null,
        noticePacketRef: body.noticePacketRef ?? null,
        appealPacketRef: body.appealPacketRef ?? null,
        retentionPolicyRef: body.retentionPolicyRef ?? null,
        deliveryTrackingRef: body.deliveryTrackingRef ?? null,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-deliver-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-borrower-notice-delivery",
          "adverse-action-notice-delivery",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "requires-redacted-notice-packet",
          "requires-appeal-rights-packet",
          "requires-retention-policy",
          "external-provider-delivery-not-performed",
        ],
        redactionRequirements: [
          "redact-internal-review-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const noticeDelivery = await persistBorrowerNoticeDelivery({
      traceId,
      decisionNoticeId: body.decisionNoticeId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      noticeType: body.noticeType,
      deliveryChannel: body.deliveryChannel,
      noticePacketRef: body.noticePacketRef,
      redactionProfileRef: body.redactionProfileRef,
      redactionStatus: body.redactionStatus,
      appealPacketRef: body.appealPacketRef,
      retentionPolicyRef: body.retentionPolicyRef,
      deliveryTrackingRef: body.deliveryTrackingRef,
      deliveryProviderRef: body.deliveryProviderRef,
      deliveryProviderConfigured: body.deliveryProviderConfigured,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        deliveryId: noticeDelivery.delivery.id,
        decisionNoticeId: noticeDelivery.delivery.decisionNoticeId,
        deliveryStatus: noticeDelivery.delivery.deliveryStatus,
        deliveryAllowed: noticeDelivery.deliveryAllowed,
        borrowerDisclosureAllowed:
          noticeDelivery.delivery.borrowerDisclosureAllowed,
        externalDeliveryPerformed:
          noticeDelivery.delivery.externalDeliveryPerformed,
        gates: noticeDelivery.gates,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-notices-deliver-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-borrower-notice-delivery",
          "adverse-action-notice-delivery",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "delivery-record-only",
          "external-provider-delivery-not-performed",
          "requires-controlled-delivery-provider-before-external-send",
        ],
        redactionRequirements: [
          "redact-internal-review-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(noticeDelivery.delivery.id),
      outputType: "borrower_notice_delivery_control",
      audience: "governance",
      claimType: "fact",
      summary:
        "Borrower notice delivery controls were evaluated against final notice approval, redaction, appeal, retention, tracking, and delivery-channel gates.",
      ruleVersion: "borrower-notice-delivery-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: !noticeDelivery.deliveryAllowed,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: String(noticeDelivery.decisionNotice.id),
          sourceType: "human_review",
          sourceName: "regulated-decision-notice",
          sourceVersion: "regulated-decision-notices-v0.1.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        deliveryId: noticeDelivery.delivery.id,
        decisionNoticeId: noticeDelivery.delivery.decisionNoticeId,
        deliveryAllowed: noticeDelivery.deliveryAllowed,
        externalDeliveryPerformed: false,
        gates: noticeDelivery.gates,
      },
    });

    const observability = createObservabilityEvent({
      eventType: noticeDelivery.deliveryAllowed
        ? "BORROWER_NOTICE_DELIVERY_READY"
        : "BORROWER_NOTICE_DELIVERY_BLOCKED",
      domain: "operations",
      severity: noticeDelivery.deliveryAllowed ? "INFO" : "WARN",
      message: noticeDelivery.deliveryAllowed
        ? "Borrower notice delivery packet is ready for controlled provider handling. No external delivery was performed."
        : "Borrower notice delivery controls blocked delivery readiness.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.notices.deliver",
      metadata: {
        deliveryId: noticeDelivery.delivery.id,
        decisionNoticeId: noticeDelivery.delivery.decisionNoticeId,
        deliveryStatus: noticeDelivery.delivery.deliveryStatus,
        deliveryAllowed: noticeDelivery.deliveryAllowed,
        externalDeliveryPerformed: false,
        gates: noticeDelivery.gates,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "borrower_notice_delivery_input",
          resourceId: body.decisionNoticeId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/deliver",
            stage: "input",
          },
        },
        {
          resourceType: "borrower_notice_delivery_output",
          resourceId: String(noticeDelivery.delivery.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/notices/deliver",
            stage: "output",
            decisionNoticeId: noticeDelivery.delivery.decisionNoticeId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_notice_delivery",
        targetId: String(noticeDelivery.delivery.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "borrower-notice-delivery-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          deliveryId: noticeDelivery.delivery.id,
          deliveryAllowed: noticeDelivery.deliveryAllowed,
          deliveryStatus: noticeDelivery.delivery.deliveryStatus,
          externalDeliveryPerformed: false,
          gates: noticeDelivery.gates,
        },
        metadata: {
          route: "/api/notices/deliver",
          operation: "borrower-notice.deliver",
        },
      },
      metadata: {
        route: "/api/notices/deliver",
        operation: "borrower-notice.deliver",
      },
    });

    return NextResponse.json({
      ok: true,
      delivery: deliveryResponse(noticeDelivery.delivery),
      result: {
        deliveryAllowed: noticeDelivery.deliveryAllowed,
        borrowerDisclosureAllowed:
          noticeDelivery.delivery.borrowerDisclosureAllowed,
        externalDeliveryPerformed:
          noticeDelivery.delivery.externalDeliveryPerformed,
        deliveryStatus: noticeDelivery.delivery.deliveryStatus,
        noticePacketStatus: noticeDelivery.delivery.noticePacketStatus,
        gates: noticeDelivery.gates,
        message: noticeDelivery.deliveryAllowed
          ? "Borrower notice packet is ready for controlled delivery handling. No external provider delivery was performed."
          : "Borrower notice delivery is blocked. This record is not an external delivery event.",
      },
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
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
      eventType: "BORROWER_NOTICE_DELIVERY_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Borrower notice delivery encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.notices.deliver",
      metadata: {
        route: "/api/notices/deliver",
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice delivery error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/notices/deliver",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown borrower notice delivery error.",
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
