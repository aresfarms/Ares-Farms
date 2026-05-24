import { NextRequest, NextResponse } from "next/server";

import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Borrower Onboarding API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces intake accountability, auditability, and governed borrower handling.
 *
 * - Vol II: Regulatory Governance
 *   Supports compliant intake processing and regulated onboarding review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe onboarding execution and governed intake lineage.
 *
 * - Vol IV: Operational Runbooks
 *   Supports intake review, escalation, remediation, and operator workflows.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, replay lineage,
 *   observability, and governed disclosure.
 */

function createOnboardTraceId(): string {
  return `onboard-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  try {
    const traceId = createOnboardTraceId();
    const body = await req.json();

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower.onboard",
      module: "api.onboard",
      traceId,
      schemaVersion: "borrower-onboarding-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      metadata: {
        route: "/api/onboard",
        borrowerIntakeSurface: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked onboarding request.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "borrower.onboard",
      module: "api.onboard",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "borrower-onboarding-v0.1.0",
          "src/app/api/onboard/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volume-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
      ],
    });

    const classifiedPayload = classifyRecord(body, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-onboard-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-underwriter",
        "authorized-operator",
        "governance",
      ],
      sharingPermissions: [
        "borrower-underwriting-review",
        "regulated-operational-processing",
      ],
      exportRestrictions: [
        "requires-governed-access",
        "requires-authorized-processing-context",
      ],
      redactionRequirements: [
        "redact-sensitive-pii-for-non-underwriting-audiences",
      ],
      consentRequirements: ["borrower-submission-consent"],
    });

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "borrower_onboarding_submission",
      audience: "internal",
      claimType: "fact",
      summary:
        "Borrower onboarding request processed through governed runtime intake controls.",
      ruleVersion: "borrower-onboarding-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        borrowerIntakeSurface: true,
        classified: true,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "BORROWER_ONBOARDING_SUBMITTED",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower onboarding request processed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      module: "api.onboard",
      metadata: {
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedPayload.classification.classificationLevel,
      },
    });

    return NextResponse.json({
      ok: true,
      accepted: true,
      onboarding: classifiedPayload,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        classification: classifiedPayload.classification,
        explainability: explanation,
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
            : "Unknown onboarding runtime error.",
      },
      { status: 500 }
    );
  }
}
