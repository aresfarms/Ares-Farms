import { and, desc, eq } from "drizzle-orm";

import {
  applicationDocuments,
  serviceRequests,
  syntheticFixtureLineageRecords,
  type ServiceRequestRow,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  bindSyntheticFixtureLineage,
  type SyntheticFixtureContext,
} from "@/lib/testing/syntheticFixtureLineage";

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
  | "financing_deal_intake"
  | "professional_credential_verification_request"
  | "stripe_connect_account_onboarding";

/**
 * Canonical financing-deal lifecycle (founder direction 2026-08-05: the
 * portal must track deals to completion OR failure — both outcomes are
 * first-class). Operators set these via the queue; the customer status
 * portal shows the customer-safe label. Free-form statuses remain accepted
 * for non-financing request types.
 */
export const FINANCING_DEAL_STATUSES: ReadonlyArray<{
  status: string;
  customerLabel: string;
}> = [
  {
    status: "SUBMITTED_PENDING_REVIEW",
    customerLabel: "Received — awaiting Capital Desk review",
  },
  { status: "IN_LENDER_REVIEW", customerLabel: "In review with the Capital Desk / assigned finance provider" },
  {
    status: "DOCUMENTS_REQUESTED",
    customerLabel: "Documents requested — use your secure upload link",
  },
  { status: "UNDERWRITING_IN_PROGRESS", customerLabel: "In underwriting" },
  {
    status: "APPROVED_PROCEEDING_TO_CLOSE",
    customerLabel: "Approved — proceeding toward closing",
  },
  { status: "CLOSED_FUNDED", customerLabel: "Closed and funded" },
  {
    status: "DECLINED_BY_LENDER",
    customerLabel: "The lender was unable to proceed with this request",
  },
  {
    status: "WITHDRAWN_BY_CUSTOMER",
    customerLabel: "Withdrawn at your request",
  },
  {
    status: "CLOSED_NOT_COMPLETED",
    customerLabel: "Closed without completing — see the case note",
  },
];

export function customerStatusLabel(
  status: string | null | undefined,
): string | null {
  if (!status) return null;
  return (
    FINANCING_DEAL_STATUSES.find((s) => s.status === status)?.customerLabel ??
    status
  );
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
  syntheticFixtureContext?: SyntheticFixtureContext | null;
};

/**
 * Persist one governed service-request order/intake row. The domain record is
 * durable (unlike the deterministic-only advisory routes) because a licensed
 * professional must be able to retrieve and act on it — but it holds property +
 * contact + scope only, never full financials or any demographic data.
 */
export async function persistServiceRequest(
  input: PersistServiceRequestInput,
): Promise<ServiceRequestRow> {
  const syntheticFixture = input.syntheticFixtureContext
    ? bindSyntheticFixtureLineage(
        input.syntheticFixtureContext,
        "service_request",
        input.serviceRequestId,
      )
    : null;

  if (
    syntheticFixture &&
    (input.contactName ?? "").trim() !== syntheticFixture.humanVisibleName
  ) {
    throw new Error(
      "Synthetic fixture human-visible name must match its registered persona.",
    );
  }

  const metadata = syntheticFixture
    ? { ...(input.metadata ?? {}), syntheticFixture }
    : (input.metadata ?? null);

  return db.transaction(async (tx) => {
    const [row] = await tx
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
        metadata,
      })
      .returning();

    if (syntheticFixture) {
      await tx.insert(syntheticFixtureLineageRecords).values({
        syntheticPersonaId: syntheticFixture.syntheticPersonaId,
        humanVisibleName: syntheticFixture.humanVisibleName,
        testRunId: syntheticFixture.testRunId,
        fixtureVersion: syntheticFixture.fixtureVersion,
        registryVersion: syntheticFixture.registryVersion,
        lineageVersion: syntheticFixture.lineageVersion,
        environment: syntheticFixture.environment,
        operatorIdentity: syntheticFixture.operatorIdentity,
        fixtureCreatedAt: new Date(syntheticFixture.createdAt),
        scenarioId: syntheticFixture.scenarioId,
        providerTargets: [...syntheticFixture.providerTargets],
        recordType: syntheticFixture.recordType,
        recordId: syntheticFixture.recordId,
        lineageSha256: syntheticFixture.lineageSha256,
        lineagePayload: syntheticFixture,
        governanceVersion: GOVERNANCE_VERSION,
        classification: CLASSIFICATION,
        replayRef: input.traceId,
        traceId: input.traceId,
        source: "synthetic-fixture-lineage-runtime",
      });
    }

    return row;
  });
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
  /** Documents the BROKER addressed to the customer (approval letters, term
   *  sheets) plus signature certificates. Never the customer's own uploads,
   *  never other deals'. Download/signing tokens are minted by the API
   *  layer, not here. */
  lenderDocuments?: Array<{
    id: string;
    fileName: string | null;
    receivedAt: string | null;
    documentType: string;
    signatureRequested: boolean;
    signed: boolean;
    testSigned: boolean;
  }>;
};

/**
 * Customer-facing status lookup. Requires BOTH the reference id AND the email
 * used on the request (case-insensitive) — a reference id alone reveals
 * nothing. Returns status only; never contact PII, property, or scope. This is
 * the minimum-disclosure read behind the customer status portal.
 */
export async function getServiceRequestStatus(
  serviceRequestId: string,
  email: string,
): Promise<ServiceRequestStatusView> {
  // Forgive copy-paste debris (founder 2026-08-06: people copy the reference
  // WITH the sentence's trailing period and the lookup breaks): strip any
  // leading/trailing characters that can't be part of a reference or email.
  const rawRef = serviceRequestId.trim();
  const isAlphaNumeric = (character: string) =>
    (character >= "A" && character <= "Z") ||
    (character >= "a" && character <= "z") ||
    (character >= "0" && character <= "9");
  let refStart = 0;
  let refEnd = rawRef.length;
  while (refStart < refEnd && !isAlphaNumeric(rawRef[refStart])) refStart += 1;
  while (refEnd > refStart && !isAlphaNumeric(rawRef[refEnd - 1])) refEnd -= 1;
  const ref = rawRef.slice(refStart, refEnd).toUpperCase();
  let mail = email.trim().toLowerCase();
  while (mail.length > 0 && ".,;:".includes(mail[mail.length - 1])) {
    mail = mail.slice(0, -1);
  }
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
  const dealDesk = (
    row.metadata as {
      dealDesk?: {
        customerNote?: string | null;
        timeline?: {
          docsDueAt?: string | null;
          underwritingEtaAt?: string | null;
          closingTargetAt?: string | null;
          lenderBacklogNote?: string | null;
        };
      };
    } | null
  )?.dealDesk;
  const t = dealDesk?.timeline;
  const hasTimeline = Boolean(
    t &&
    (t.docsDueAt ||
      t.underwritingEtaAt ||
      t.closingTargetAt ||
      t.lenderBacklogNote),
  );
  const isFinancing = row.requestType === "financing_deal_intake";
  const bookingUrl =
    row.routedTo === "furlong-capital-desk"
      ? process.env.CAPITAL_DESK_BOOKING_URL?.trim() || null
      : process.env.LENDER_BOOKING_URL?.trim() || null;

  let lenderDocuments: ServiceRequestStatusView["lenderDocuments"];
  if (isFinancing) {
    const docs = await db
      .select({
        id: applicationDocuments.id,
        fileName: applicationDocuments.fileName,
        documentType: applicationDocuments.documentType,
        storageUri: applicationDocuments.storageUri,
        receivedAt: applicationDocuments.receivedAt,
        metadata: applicationDocuments.metadata,
      })
      .from(applicationDocuments)
      .where(
        eq(
          applicationDocuments.applicationId,
          `finintake-${row.serviceRequestId}`,
        ),
      );
    lenderDocuments = docs
      .filter(
        (d) =>
          (d.documentType === "lender-provided" ||
            d.documentType === "signature-certificate") &&
          d.storageUri,
      )
      .map((d) => {
        const m = (d.metadata ?? {}) as Record<string, unknown>;
        return {
          id: d.id,
          fileName: d.fileName,
          receivedAt: d.receivedAt ? d.receivedAt.toISOString() : null,
          documentType: d.documentType,
          signatureRequested: m.signatureRequested === true,
          signed:
            m.signatureStatus === "signed" ||
            m.signatureStatus === "test-signed",
          testSigned: m.signatureStatus === "test-signed",
        };
      });
  }

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
    lenderDocuments,
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
  input: ListServiceRequestsInput = {},
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
