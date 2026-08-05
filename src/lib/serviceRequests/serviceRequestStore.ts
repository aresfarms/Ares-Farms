import { and, desc, eq } from "drizzle-orm";

import { serviceRequests, type ServiceRequestRow } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Canonical Service Request Runtime (licensed-module order + intake store)
 *
 * Durable persistence for the "governed intake → licensed professional
 * fulfills" record produced by the two licensed modules. Mirrors the billing
 * event store: deterministic, replay-safe, classification-carrying inserts and
 * governed reads.
 *
 * Master Volume Governance:
 * - Vol I (FACILITATION-001): records + routes an order; never a determination.
 * - Vol II (REG-NEPA-001 / USDA-ENV-001 / CONST-PATHWAY-001): environmental
 *   requests route to the determining authority; financing requests route
 *   qualified interest to the licensed lender. Section 1071 firewall: no
 *   demographic data is accepted or stored.
 * - Vol III / III-B: durable replay-safe order state before fulfillment
 *   surfaces consume it.
 * - Vol V (CANON-CLASS-001): Level 4 RESTRICTED. (HITL-GOV-001): human review
 *   required. (CANON-TREASURY-001 §9.1): fee-disclosure acknowledgement
 *   recorded. (CANON-CONSENT-001): consent recorded before action.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";
const SERVICE_REQUEST_SOURCE = "service-request-runtime";

export type ServiceRequestType =
  | "environmental_report_order"
  | "financing_deal_intake";

/**
 * Canonical financing-deal lifecycle (founder direction 2026-08-05: the
 * portal must track deals to completion OR failure — both outcomes are
 * first-class). Operators set these via the queue; the customer status
 * portal shows the customer-safe label. Free-form statuses remain accepted
 * for non-financing request types.
 */
export const FINANCING_DEAL_STATUSES: ReadonlyArray<{ status: string; customerLabel: string }> = [
  { status: "SUBMITTED_PENDING_REVIEW", customerLabel: "Received — awaiting the lender's first review" },
  { status: "IN_LENDER_REVIEW", customerLabel: "In review with the licensed lender" },
  { status: "DOCUMENTS_REQUESTED", customerLabel: "The lender needs documents — use your secure upload link" },
  { status: "UNDERWRITING_IN_PROGRESS", customerLabel: "In underwriting" },
  { status: "APPROVED_PROCEEDING_TO_CLOSE", customerLabel: "Approved — proceeding toward closing" },
  { status: "CLOSED_FUNDED", customerLabel: "Closed and funded" },
  { status: "DECLINED_BY_LENDER", customerLabel: "The lender was unable to proceed with this request" },
  { status: "WITHDRAWN_BY_CUSTOMER", customerLabel: "Withdrawn at your request" },
  { status: "CLOSED_NOT_COMPLETED", customerLabel: "Closed without completing — see your lender's note" },
];

export function customerStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  return FINANCING_DEAL_STATUSES.find((s) => s.status === status)?.customerLabel ?? status;
}

export type PersistServiceRequestInput = {
  traceId: string;
  serviceRequestId: string;
  requestType: ServiceRequestType;
  serviceCode?: string | null;
  status?: string | null;
  routedTo: string;
  tenantId?: string | null;
  actorId?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  reportId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  propertyDescriptor?: string | null;
  locationState?: string | null;
  locationCounty?: string | null;
  scopeSummary?: string | null;
  estimatedValue?: number | null;
  feeDisclosureAcknowledged?: boolean;
  consentAcknowledged?: boolean;
  humanReviewRequired?: boolean;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * Persist one governed service-request order/intake row. The domain record is
 * durable (unlike the deterministic-only advisory routes) because a licensed
 * professional must be able to retrieve and act on it — but it holds property +
 * contact + scope only, never full financials or any demographic data.
 */
export async function persistServiceRequest(
  input: PersistServiceRequestInput
): Promise<ServiceRequestRow> {
  const [row] = await db
    .insert(serviceRequests)
    .values({
      serviceRequestId: input.serviceRequestId,
      requestType: input.requestType,
      serviceCode: input.serviceCode ?? null,
      status: input.status ?? "SUBMITTED_PENDING_REVIEW",
      routedTo: input.routedTo,
      tenantId: input.tenantId ?? null,
      actorId: input.actorId ?? null,
      userId: input.userId ?? null,
      applicationId: input.applicationId ?? null,
      reportId: input.reportId ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      propertyDescriptor: input.propertyDescriptor ?? null,
      locationState: input.locationState ?? null,
      locationCounty: input.locationCounty ?? null,
      scopeSummary: input.scopeSummary ?? null,
      estimatedValue: input.estimatedValue ?? null,
      feeDisclosureAcknowledged: input.feeDisclosureAcknowledged ?? false,
      consentAcknowledged: input.consentAcknowledged ?? false,
      humanReviewRequired: input.humanReviewRequired ?? true,
      determinationIssued: false,
      requestPayload: input.requestPayload ?? null,
      responsePayload: input.responsePayload ?? null,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: SERVICE_REQUEST_SOURCE,
      metadata: input.metadata ?? null,
    })
    .returning();

  return row;
}

export type ServiceRequestStatusView = {
  found: boolean;
  serviceRequestId?: string;
  requestType?: ServiceRequestType;
  routedTo?: string;
  status?: string;
  statusLabel?: string | null;
  submittedAt?: string | null;
  /** Customer-visible note the licensed professional wrote for THIS request. */
  lenderNote?: string | null;
  /** Customer-safe closing timeline (lender-maintained; moves with real
   *  lender/USDA/SBA backlogs — the backlog note explains why). */
  timeline?: {
    docsDueAt: string | null;
    underwritingEtaAt: string | null;
    closingTargetAt: string | null;
    lenderBacklogNote: string | null;
  } | null;
  /** Scheduling link so the customer books a call instead of cold-calling. */
  bookingUrl?: string | null;
};

/**
 * Customer-facing status lookup. Requires BOTH the reference id AND the email
 * used on the request (case-insensitive) — a reference id alone reveals
 * nothing. Returns status only; never contact PII, property, or scope. This is
 * the minimum-disclosure read behind the customer status portal.
 */
export async function getServiceRequestStatus(
  serviceRequestId: string,
  email: string
): Promise<ServiceRequestStatusView> {
  const ref = serviceRequestId.trim();
  const mail = email.trim().toLowerCase();
  if (!ref || !mail) return { found: false };

  const rows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.serviceRequestId, ref))
    .limit(1);

  const row = rows[0];
  if (!row || (row.contactEmail ?? "").trim().toLowerCase() !== mail) {
    return { found: false };
  }

  // Deal-desk state (lender-authored) — surface ONLY the customer-safe
  // subset: the note written FOR the customer and the timeline. Never
  // reminders metadata, actor ids, or anything the lender didn't intend
  // the customer to read.
  const dealDesk = (row.metadata as {
    dealDesk?: {
      customerNote?: string | null;
      timeline?: {
        docsDueAt?: string | null;
        underwritingEtaAt?: string | null;
        closingTargetAt?: string | null;
        lenderBacklogNote?: string | null;
      };
    };
  } | null)?.dealDesk;
  const t = dealDesk?.timeline;
  const hasTimeline = Boolean(
    t && (t.docsDueAt || t.underwritingEtaAt || t.closingTargetAt || t.lenderBacklogNote)
  );
  const isFinancing = row.requestType === "financing_deal_intake";
  const bookingUrl = process.env.LENDER_BOOKING_URL?.trim() || null;

  return {
    found: true,
    serviceRequestId: row.serviceRequestId,
    requestType: row.requestType as ServiceRequestType,
    routedTo: row.routedTo,
    status: row.status,
    statusLabel: isFinancing ? customerStatusLabel(row.status) : null,
    submittedAt: row.occurredAt ? row.occurredAt.toISOString() : null,
    lenderNote: dealDesk?.customerNote ?? null,
    timeline: hasTimeline
      ? {
          docsDueAt: t?.docsDueAt ?? null,
          underwritingEtaAt: t?.underwritingEtaAt ?? null,
          closingTargetAt: t?.closingTargetAt ?? null,
          lenderBacklogNote: t?.lenderBacklogNote ?? null,
        }
      : null,
    bookingUrl: isFinancing ? bookingUrl : null,
  };
}

export type ListServiceRequestsInput = {
  requestType?: ServiceRequestType | null;
  routedTo?: string | null;
  status?: string | null;
  tenantId?: string | null;
  limit?: number | null;
};

/**
 * Governed read for operator / licensed-professional fulfillment surfaces.
 * Callers must already be authorized (role-gated route) — this is the query,
 * not the access decision.
 */
export async function listServiceRequests(
  input: ListServiceRequestsInput = {}
): Promise<ServiceRequestRow[]> {
  const filters = [
    input.requestType
      ? eq(serviceRequests.requestType, input.requestType)
      : null,
    input.routedTo ? eq(serviceRequests.routedTo, input.routedTo) : null,
    input.status ? eq(serviceRequests.status, input.status) : null,
    input.tenantId ? eq(serviceRequests.tenantId, input.tenantId) : null,
  ].filter((clause): clause is NonNullable<typeof clause> => clause !== null);

  const query = db
    .select()
    .from(serviceRequests)
    .orderBy(desc(serviceRequests.occurredAt))
    .limit(Math.min(Math.max(input.limit ?? 100, 1), 500));

  if (filters.length === 0) {
    return query;
  }

  return query.where(filters.length === 1 ? filters[0] : and(...filters));
}
