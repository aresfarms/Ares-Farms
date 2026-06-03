import { NextRequest, NextResponse } from "next/server";

import {
  CUSTOMER_TYPE_RUNTIME_VERSION,
  CustomerTypeInput,
  composeCustomerTypeRegistry,
} from "@/lib/customer-types/customerTypeRuntime";
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
 * Customer Type Registry API
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): preserves constitutional authority
 *   over customer-type composition; the route never claims authority.
 * - Vol II (Regulatory Governance): every customer-type-level review
 *   routes to the named sponsor / regulatory authority.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   composition over the canonical Customer Type runtime.
 * - Vol III-B (Governance Runtime): runtime guard, classification,
 *   version lineage, observability, explainability, replay verification,
 *   and audit-safe error envelope.
 * - Vol IV (Operational Runbooks): routes governed handoffs to the
 *   Capital Graph, financing pathway guidance, opportunity discovery,
 *   advanced intelligence, evidence engine, certification engine,
 *   registry framework, governance, reviews, and downstream consumers.
 * - Vol V (Canonical Doctrines): preserves canonical claims governance,
 *   controlled disclosure, replay, audit, portability, and source-
 *   authority boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every customer-type
 *   entry behind a public-safe DTO; no raw borrower records, no live
 *   external fetch, no source-certainty claim.
 */

type CustomerTypeRequest = CustomerTypeInput;

function createCustomerTypeTraceId(): string {
  return `customer-type-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createCustomerTypeTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as CustomerTypeRequest;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.customer.type.compose",
      module: "api.governance.customer-types",
      traceId,
      schemaVersion: "customer-type-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/customer-types",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CUSTOMER_TYPE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Customer Type runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.customer-types",
        metadata: {
          route: "/api/governance/customer-types",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/customer-types",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked Customer Type request.",
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
      operation: "governance.customer.type.compose",
      module: "api.governance.customer-types",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "customer-type-request-v0.1.0",
          "src/app/api/governance/customer-types/route.ts",
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
          CUSTOMER_TYPE_RUNTIME_VERSION,
          "src/lib/customer-types/customerTypeRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "capital-graph-runtime-v0.1.0",
          "src/lib/capital-graph/capitalGraphRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-customer-type-route",
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
        "not-a-customer-eligibility-determination",
        "not-an-approval",
        "not-a-credit-decision",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-lender-commitment",
        "not-a-live-external-action",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: ["governance-customer-type-review-consent"],
    });

    const customerTypeResult = composeCustomerTypeRegistry(body);

    const classifiedOutput = classifyRecord(
      {
        customerTypeResult,
        event: {
          eventType: "governance.customer.type.composed",
          applicationId: customerTypeResult.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-customer-type-route-output",
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
          "not-a-customer-eligibility-determination",
          "not-an-approval",
          "not-a-credit-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-a-program-approval",
          "not-a-tax-credit-allocation",
          "not-an-environmental-clearance",
          "not-a-carbon-credit-issuance",
          "not-a-live-external-action",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: ["governance-customer-type-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "customer_type_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Customer Type pack composed as advisory, replay-safe, audit-safe, conflict-preserving internal evidence only. No autonomous customer eligibility determination, credit decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, or legal reliance is created.",
      ruleVersion: CUSTOMER_TYPE_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(
          0.45,
          0.45 + customerTypeResult.summary.matchedTypeCount / 30
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        archetypeCount: customerTypeResult.summary.archetypeCount,
        customerTypeCount: customerTypeResult.summary.customerTypeCount,
        matchedTypeCount: customerTypeResult.summary.matchedTypeCount,
        totalEligibleCapitalRefCount:
          customerTypeResult.summary.totalEligibleCapitalRefCount,
        conflictSignalCount:
          customerTypeResult.summary.conflictSignalCount,
        sovereignTypeCount: customerTypeResult.summary.sovereignTypeCount,
        noAutonomousEligibility:
          customerTypeResult.noAutonomousEligibility,
        replaySafe: customerTypeResult.replaySafe,
        auditSafe: customerTypeResult.auditSafe,
        conflictPreserving: customerTypeResult.conflictPreserving,
        federationScoped: customerTypeResult.federationScoped,
        productionBlocked: customerTypeResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "CUSTOMER_TYPE_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Customer Type pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.customer-types",
      metadata: {
        route: "/api/governance/customer-types",
        archetypeCount: customerTypeResult.summary.archetypeCount,
        customerTypeCount: customerTypeResult.summary.customerTypeCount,
        matchedTypeCount: customerTypeResult.summary.matchedTypeCount,
        totalEligibleCapitalRefCount:
          customerTypeResult.summary.totalEligibleCapitalRefCount,
        sovereignTypeCount: customerTypeResult.summary.sovereignTypeCount,
        participantTypeCount:
          customerTypeResult.summary.participantTypeCount,
        publicTypeCount: customerTypeResult.summary.publicTypeCount,
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
          resourceType: "customer_type_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/customer-types",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "customer_type_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/customer-types",
            stage: "output",
            advisoryOnly: true,
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
        targetType: "customer_type_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: CUSTOMER_TYPE_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          archetypeCount: customerTypeResult.summary.archetypeCount,
          customerTypeCount:
            customerTypeResult.summary.customerTypeCount,
          matchedTypeCount: customerTypeResult.summary.matchedTypeCount,
          totalEligibleCapitalRefCount:
            customerTypeResult.summary.totalEligibleCapitalRefCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/customer-types",
          operation: "governance.customer.type.compose",
        },
      },
      metadata: {
        route: "/api/governance/customer-types",
        operation: "governance.customer.type.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      customerTypeResult,
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
      eventType: "CUSTOMER_TYPE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Customer Type API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.customer-types",
      metadata: {
        route: "/api/governance/customer-types",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Customer Type runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/customer-types",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Customer Type runtime error.",
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
