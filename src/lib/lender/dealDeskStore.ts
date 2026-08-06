import { desc, eq } from "drizzle-orm";

import { applicationDocuments, serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { mintUploadLinkToken } from "@/lib/documents/uploadLinkToken";
import { emailConfigured, sendEmail } from "@/lib/notifications/emailProvider";
import { LENDER_EMAIL_SIGNATURE, renderLenderEmailHtml } from "@/lib/notifications/lenderSignature";

/**
 * Lender Deal Desk store (founder direction 2026-08-05): the licensed
 * lender's working surface over financing deals — status + customer-visible
 * note + closing timeline (lender-editable for USDA/SBA backlogs), the
 * document register, and the automatic document-reminder engine that ends
 * the customer-chasing Stuart hates.
 *
 * All lender-authored deal state lives in serviceRequests.metadata.dealDesk
 * (no migration needed): { customerNote, timeline{docsDueAt, underwritingEtaAt,
 * closingTargetAt, lenderBacklogNote}, reminders[], updatedAt, updatedBy }.
 *
 * Master Volume Governance: Vol II regulated communication boundaries
 * (customer-visible note is minimum-disclosure, shown only behind the
 * ref+email status lookup); Vol IV operational runbooks (reminder cadence,
 * timeline review); Vol V observability + replay via callers' trace ids.
 */

const REMINDER_INTERVAL_DAYS = 3;
const REMINDER_MAX = 3;
const FINANCING_TYPE = "financing_deal_intake";

export interface DealTimeline {
  docsDueAt: string | null;
  underwritingEtaAt: string | null;
  closingTargetAt: string | null;
  lenderBacklogNote: string | null;
}

export interface DealDeskState {
  customerNote: string | null;
  timeline: DealTimeline;
  reminders: string[]; // ISO timestamps of sent reminders
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface DealSummary {
  serviceRequestId: string;
  status: string;
  serviceCode: string | null;
  routedTo: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  mailingAddress: string | null;
  propertyDescriptor: string | null;
  locationState: string | null;
  locationCounty: string | null;
  scopeSummary: string | null;
  estimatedValue: number | null;
  submittedAt: string | null;
  deskState: DealDeskState;
  applicationId: string;
  documentCount: number;
}

function mailingAddressFrom(metadata: unknown): string | null {
  const raw = metadata as {
    contactAddress?: string | null;
    mailingAddress?: { street?: string | null; city?: string | null; state?: string | null; postalCode?: string | null } | null;
  } | null;
  const m = raw?.mailingAddress;
  const parts = m
    ? [m.street, m.city, m.state, m.postalCode].filter((p): p is string => Boolean(p && p.trim()))
    : [];
  if (parts.length > 0) return parts.join(", ");
  return raw?.contactAddress?.trim() || null;
}

function deskStateFrom(metadata: unknown): DealDeskState {
  const raw = (metadata as { dealDesk?: Partial<DealDeskState> } | null)?.dealDesk ?? {};
  const t = (raw.timeline ?? {}) as Partial<DealTimeline>;
  return {
    customerNote: raw.customerNote ?? null,
    timeline: {
      docsDueAt: t.docsDueAt ?? null,
      underwritingEtaAt: t.underwritingEtaAt ?? null,
      closingTargetAt: t.closingTargetAt ?? null,
      lenderBacklogNote: t.lenderBacklogNote ?? null,
    },
    reminders: Array.isArray(raw.reminders) ? raw.reminders : [],
    updatedAt: raw.updatedAt ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

export function applicationIdForDeal(serviceRequestId: string): string {
  return `finintake-${serviceRequestId}`;
}

export async function listLenderDeals(limit = 50): Promise<DealSummary[]> {
  const rows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.requestType, FINANCING_TYPE))
    .orderBy(desc(serviceRequests.occurredAt))
    .limit(Math.min(limit, 200));
  const summaries: DealSummary[] = [];
  for (const row of rows) {
    const applicationId = applicationIdForDeal(row.serviceRequestId);
    const docs = await db
      .select({ id: applicationDocuments.id })
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, applicationId));
    summaries.push({
      serviceRequestId: row.serviceRequestId,
      status: row.status,
      serviceCode: row.serviceCode,
      routedTo: row.routedTo,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      mailingAddress: mailingAddressFrom(row.metadata),
      propertyDescriptor: row.propertyDescriptor,
      locationState: row.locationState,
      locationCounty: row.locationCounty,
      scopeSummary: row.scopeSummary,
      estimatedValue: row.estimatedValue,
      submittedAt: row.occurredAt ? row.occurredAt.toISOString() : null,
      deskState: deskStateFrom(row.metadata),
      applicationId,
      documentCount: docs.length,
    });
  }
  return summaries;
}

export async function listDealDocuments(applicationId: string) {
  const rows = await db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId))
    .orderBy(desc(applicationDocuments.createdAt));
  return rows.map((d) => {
    const m = (d.metadata ?? {}) as Record<string, unknown>;
    return {
      id: d.id,
      documentType: d.documentType,
      fileName: d.fileName,
      mimeType: d.mimeType,
      byteSize: d.byteSize,
      status: d.status,
      reviewStatus: d.reviewStatus,
      storageUri: d.storageUri,
      receivedAt: d.receivedAt ? d.receivedAt.toISOString() : null,
      signatureRequested: m.signatureRequested === true,
      signed: m.signatureStatus === "signed",
      signedByTypedName: typeof m.signedByTypedName === "string" ? m.signedByTypedName : null,
      scanStatus:
        m.scanStatus === "clean" || m.scanStatus === "infected" || m.scanStatus === "unavailable"
          ? (m.scanStatus as string)
          : "pending",
    };
  });
}

export async function updateDealDesk(args: {
  serviceRequestId: string;
  status?: string | null;
  customerNote?: string | null;
  timeline?: Partial<DealTimeline> | null;
  actorId: string;
}): Promise<DealDeskState | null> {
  const rows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.serviceRequestId, args.serviceRequestId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const current = deskStateFrom(row.metadata);
  const next: DealDeskState = {
    customerNote: args.customerNote !== undefined ? args.customerNote : current.customerNote,
    timeline: { ...current.timeline, ...(args.timeline ?? {}) },
    reminders: current.reminders,
    updatedAt: new Date().toISOString(),
    updatedBy: args.actorId,
  };
  await db
    .update(serviceRequests)
    .set({
      status: args.status ?? row.status,
      metadata: { ...((row.metadata as Record<string, unknown>) ?? {}), dealDesk: next },
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.serviceRequestId, args.serviceRequestId));
  return next;
}

function bookingUrl(): string | null {
  const url = process.env.LENDER_BOOKING_URL;
  return url && url.trim() ? url.trim() : null;
}

/**
 * Send one document reminder for a deal: fresh sovereign upload link, the
 * lender's note, and the booking link so the customer schedules a call
 * instead of cold-calling. Returns what happened, honestly.
 */
export async function sendDocumentReminder(args: {
  serviceRequestId: string;
  portalBaseUrl: string;
  force?: boolean;
}): Promise<{ sent: boolean; reason: string }> {
  const rows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.serviceRequestId, args.serviceRequestId))
    .limit(1);
  const row = rows[0];
  if (!row) return { sent: false, reason: "deal-not-found" };
  if (!row.contactEmail) return { sent: false, reason: "no-contact-email" };
  const desk = deskStateFrom(row.metadata);
  if (!args.force) {
    if (desk.reminders.length >= REMINDER_MAX) return { sent: false, reason: "reminder-cap-reached" };
    const last = desk.reminders[desk.reminders.length - 1];
    if (last && Date.now() - new Date(last).getTime() < REMINDER_INTERVAL_DAYS * 86_400_000) {
      return { sent: false, reason: "too-soon" };
    }
  }
  if (!emailConfigured()) return { sent: false, reason: "email-not-configured" };

  const link = mintUploadLinkToken({
    applicationId: applicationIdForDeal(row.serviceRequestId),
    dealRef: row.serviceRequestId,
  });
  const uploadUrl = `${args.portalBaseUrl}/secure-upload?token=${encodeURIComponent(link.token)}`;
  const booking = bookingUrl();
  const dueLine = desk.timeline.docsDueAt
    ? `Your broker has asked for these by ${new Date(desk.timeline.docsDueAt).toLocaleDateString()}.\n\n`
    : "";
  const bodyText =
    `Your commercial debt broker is waiting on documents for financing request:\n${row.serviceRequestId}\n\n` +
    dueLine +
    (desk.customerNote ? `Note from your broker: ${desk.customerNote}\n\n` : "") +
    `Upload them securely here (encrypted, never by email):\n${uploadUrl}\n\n` +
    (booking ? `Schedule a call with your broker:\n${booking}\n\n` : "") +
    `Check your request status any time:\n${args.portalBaseUrl}/status\n\n` +
    `This link is single-purpose and expires in 72 hours; a fresh one arrives with each reminder.`;
  const result = await sendEmail({
    to: row.contactEmail,
    subject: `Documents needed for your financing request ${row.serviceRequestId}`,
    text: `${bodyText}\n\nThis message contains no account details by design — everything sensitive stays inside the portal.\n\n${LENDER_EMAIL_SIGNATURE}`,
    html: renderLenderEmailHtml(bodyText),
    inlineBrandLogo: true,
  });
  if (result.sent) {
    const nextDesk = { ...desk, reminders: [...desk.reminders, new Date().toISOString()] };
    await db
      .update(serviceRequests)
      .set({ metadata: { ...((row.metadata as Record<string, unknown>) ?? {}), dealDesk: nextDesk }, updatedAt: new Date() })
      .where(eq(serviceRequests.serviceRequestId, args.serviceRequestId));
    return { sent: true, reason: "sent" };
  }
  return { sent: false, reason: result.mode ?? "send-failed" };
}

/** Run reminders for every deal sitting in DOCUMENTS_REQUESTED. */
export async function runDueReminders(portalBaseUrl: string): Promise<{ attempted: number; sent: number }> {
  const rows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.status, "DOCUMENTS_REQUESTED"))
    .limit(200);
  let sent = 0;
  for (const row of rows) {
    const result = await sendDocumentReminder({ serviceRequestId: row.serviceRequestId, portalBaseUrl });
    if (result.sent) sent += 1;
  }
  return { attempted: rows.length, sent };
}
