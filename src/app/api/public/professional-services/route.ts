import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { notifyOnServiceRequest } from "@/lib/notifications/notificationDispatch";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { sanitizeIngestText } from "@/lib/security/ingestSanitizer";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import { persistServiceRequest } from "@/lib/serviceRequests/serviceRequestStore";

const SERVICE_TYPES = {
  "phase-i-esa": "Phase I environmental site assessment",
  "phase-ii-investigation": "Phase II environmental investigation",
  "phase-iii-remediation": "Phase III remediation",
  "remediation-site-supervision": "Remediation or site supervision",
  "environmental-consulting": "Environmental engineering consulting",
  "civil-engineering-consulting": "Civil engineering consulting",
  "chemical-engineering-consulting": "Chemical engineering consulting",
  "nuclear-engineering-consulting": "Nuclear engineering consulting",
  "general-engineering-advisory": "Other engineering advisory",
  "professional-firm-referral": "Stamped-plan or specialist-firm referral",
  "custom-concept-review": "Custom property or enterprise concept review",
} as const;

type ServiceType = keyof typeof SERVICE_TYPES;
type Body = {
  serviceType?: unknown;
  contactName?: unknown;
  contactEmail?: unknown;
  contactPhone?: unknown;
  exactAddress?: unknown;
  scopeSummary?: unknown;
  desiredTiming?: unknown;
  consent?: unknown;
};

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function cleaned(value: unknown, maximum: number): string {
  return sanitizeIngestText(typeof value === "string" ? value : null, maximum);
}

function email(value: unknown): string {
  const normalized = cleaned(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
}

export async function POST(req: NextRequest) {
  const traceId = "professional-scope-" + randomUUID();
  const parsed = await readJsonBodyWithLimit<Body>(req, {
    maxBytes: 24 * 1024,
  });
  if (!parsed.ok) {
    return response({ ok: false, error: parsed.error, traceId }, parsed.status);
  }

  const rawType = cleaned(parsed.body.serviceType, 80);
  const serviceType = Object.prototype.hasOwnProperty.call(
    SERVICE_TYPES,
    rawType,
  )
    ? (rawType as ServiceType)
    : null;
  const contactName = cleaned(parsed.body.contactName, 160);
  const contactEmail = email(parsed.body.contactEmail);
  const contactPhone = cleaned(parsed.body.contactPhone, 80) || null;
  const exactAddress = cleaned(parsed.body.exactAddress, 300);
  const scopeSummary = cleaned(parsed.body.scopeSummary, 3_000);
  const desiredTiming = cleaned(parsed.body.desiredTiming, 300) || null;

  if (
    !serviceType ||
    contactName.length < 2 ||
    !contactEmail ||
    exactAddress.length < 8 ||
    scopeSummary.length < 20 ||
    parsed.body.consent !== true
  ) {
    return response(
      {
        ok: false,
        error:
          "Choose a service, provide the property, contact details, and scope, then accept the scope-review terms.",
        traceId,
      },
      400,
    );
  }

  const authority = sessionAuthority(req);
  const guard = runRuntimeGuard({
    operation: "customer.professional-services.scope-request",
    module: "api.public.professional-services",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "professional-services-scope-request-v1.0.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "RESTRICTED",
    metadata: {
      serviceType,
      quoteRequired: true,
      paymentCaptured: false,
      personalFinancialInformationRequired: false,
    },
  });
  if (!guard.allowed) {
    return response(
      {
        ok: false,
        error: "Professional-services intake is temporarily unavailable.",
        traceId,
      },
      403,
    );
  }

  const serviceRequestId =
    "PRO-" + randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
  try {
    await persistServiceRequest({
      traceId,
      serviceRequestId,
      requestType: "professional_services_scope_request",
      serviceCode: serviceType,
      status: "SUBMITTED_SCOPE_REVIEW",
      routedTo: "professional-services-scope-desk",
      actorId: authority.actorId,
      contactName,
      contactEmail,
      contactPhone,
      propertyDescriptor: exactAddress,
      scopeSummary,
      feeDisclosureAcknowledged: false,
      consentAcknowledged: true,
      humanReviewRequired: true,
      requestPayload: {
        serviceType,
        serviceLabel: SERVICE_TYPES[serviceType],
        desiredTiming,
      },
      metadata: {
        route: "/api/public/professional-services",
        noChargeAtIntake: true,
        quoteRequiredBeforeWork: true,
        universalDeliveryPromise: false,
        stampedDrawingsProvidedByFurlong: false,
        structuralElectricalPlanConsultingProvidedByFurlong: false,
        noSsnOrPersonalFinancialInformationRequested: true,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "PROFESSIONAL_SERVICES_SCOPE_REQUESTED",
      domain: "operations",
      severity: "INFO",
      message: "A customer requested separately scoped professional services.",
      traceId,
      replayRef: traceId,
      actorId: authority.actorId,
      module: "api.public.professional-services",
      metadata: {
        serviceRequestId,
        serviceType,
        quoteRequired: true,
      },
    });
    await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/public/professional-services",
        serviceRequestId,
        serviceType,
        paymentCaptured: false,
      },
    });
    await notifyOnServiceRequest({
      requestType: "professional_services_scope_request",
      serviceRequestId,
      routedTo: "professional-services-scope-desk",
      traceId,
    });

    return response(
      {
        ok: true,
        serviceRequestId,
        status: "SUBMITTED_SCOPE_REVIEW",
        message:
          "Your scope request was recorded. No charge was made. Furlong will review feasibility, required evidence, timing, responsibility, and fee before any work begins.",
        boundaries: {
          decisionReportIncluded: false,
          quoteRequiredBeforeWork: true,
          stampedDrawingsProvidedByFurlong: false,
          structuralElectricalPlanConsultingProvidedByFurlong: false,
        },
        traceId,
      },
      201,
    );
  } catch {
    return response(
      {
        ok: false,
        error: "The scope request could not be recorded. No charge was made.",
        traceId,
      },
      503,
    );
  }
}
