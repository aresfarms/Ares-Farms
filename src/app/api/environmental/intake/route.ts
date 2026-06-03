import { NextRequest, NextResponse } from "next/server";

import {
  ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
  EnvironmentalIntakeInput,
  evaluateEnvironmentalIntake,
} from "@/lib/environmental/intakeRuntime";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Environmental Intake API
 *
 * Master Volume Governance:
 * - Vol I: preserves Environmental Engineering Spoke authority and Banker
 *   Spoke isolation; intake never replaces a determination.
 * - Vol II: prevents intake from becoming an official environmental
 *   determination, clearance, permit, NEPA outcome, lender commitment, or
 *   legal or regulatory reliance.
 * - Vol III: provides deterministic, replay-safe routing across NEPA
 *   screening, Phase I ESA, state environmental review, and exemption
 *   pathway scenarios.
 * - Vol III-B: attaches runtime guard, classification (RESTRICTED), version
 *   lineage, observability, explainability, replay verification, and
 *   audit-safe error envelope.
 * - Vol IV: routes missing-item handoffs to operator and borrower review
 *   surfaces; preserves recovery posture through the Module 21
 *   Environmental Compliance review surface.
 * - Vol V-VII: enforces claims governance, source authority, provider-
 *   license posture, fee-disclosure posture, conformance, and public-
 *   surface disclosure limits on borrower-readable environmental output.
 */

type EnvironmentalIntakeRequest = EnvironmentalIntakeInput & {
  userId?: string | null;
};

function createEnvironmentalIntakeTraceId(): string {
  return `environmental-intake-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createEnvironmentalIntakeTraceId();

  try {
    const body = (await req.json()) as EnvironmentalIntakeRequest;
    const actorId = body.userId ?? body.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower.environmental.intake.submit",
      module: "api.environmental.intake",
      traceId,
      schemaVersion: "environmental-intake-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/environmental/intake",
        borrowerGuidanceSurface: true,
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "ENVIRONMENTAL_INTAKE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Environmental intake runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.environmental.intake",
        metadata: {
          route: "/api/environmental/intake",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/environmental/intake",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked environmental intake request.",
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
      operation: "borrower.environmental.intake.submit",
      module: "api.environmental.intake",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "environmental-intake-request-v0.1.0",
          "src/app/api/environmental/intake/route.ts",
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
          ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
          "src/lib/environmental/intakeRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      body as Record<string, unknown>,
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "borrower",
        classificationSource: "api-environmental-intake-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-operator",
          "environmental-engineering-spoke",
          "governance",
        ],
        sharingPermissions: [
          "borrower-guidance",
          "regulated-operational-review",
          "environmental-spoke-review",
        ],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "requires-governed-access",
          "not-an-environmental-determination",
          "not-a-clearance",
          "not-a-permit",
          "not-a-provider-engagement",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-sensitive-property-context-before-external-disclosure",
        ],
        consentRequirements: ["borrower-environmental-intake-consent"],
      }
    );

    const intakeResult = evaluateEnvironmentalIntake(body);

    const classifiedOutput = classifyRecord(
      {
        intakeResult,
        event: {
          eventType: "borrower.environmental.intake.submitted",
          applicationId: body.applicationId ?? null,
          borrowerId: body.borrowerId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "borrower",
        classificationSource: "api-environmental-intake-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-operator",
          "environmental-engineering-spoke",
          "governance",
        ],
        sharingPermissions: [
          "borrower-guidance",
          "regulated-operational-review",
          "environmental-spoke-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-an-environmental-determination",
          "not-a-clearance",
          "not-a-permit",
          "not-a-provider-engagement",
          "not-an-approval",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["borrower-environmental-intake-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "borrower_environmental_intake",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Borrower environmental intake routed as advisory review guidance only. No environmental determination, clearance, permit, or provider engagement is created.",
      ruleVersion: ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.95,
        Math.max(0.4, intakeResult.readiness.readinessPercent / 100)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        assessmentRoute: intakeResult.assessmentRoute,
        pathwayPosture: intakeResult.pathwayPosture,
        readinessPercent: intakeResult.readiness.readinessPercent,
        advisoryOnly: intakeResult.advisoryOnly,
        productionBlocked: intakeResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "ENVIRONMENTAL_INTAKE_EVALUATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower environmental intake routed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.environmental.intake",
      metadata: {
        route: "/api/environmental/intake",
        applicationId: body.applicationId ?? null,
        assessmentRoute: intakeResult.assessmentRoute,
        pathwayPosture: intakeResult.pathwayPosture,
        readinessPercent: intakeResult.readiness.readinessPercent,
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
          resourceType: "environmental_intake_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/environmental/intake",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "environmental_intake_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/environmental/intake",
            stage: "output",
            advisoryOnly: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_environmental_intake",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          assessmentRoute: intakeResult.assessmentRoute,
          readinessPercent: intakeResult.readiness.readinessPercent,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/environmental/intake",
          operation: "borrower.environmental.intake.submit",
        },
      },
      metadata: {
        route: "/api/environmental/intake",
        operation: "borrower.environmental.intake.submit",
      },
    });

    return NextResponse.json({
      ok: true,
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
      eventType: "ENVIRONMENTAL_INTAKE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Environmental intake API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.environmental.intake",
      metadata: {
        route: "/api/environmental/intake",
        error:
          error instanceof Error
            ? error.message
            : "Unknown environmental intake runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/environmental/intake",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown environmental intake runtime error.",
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
