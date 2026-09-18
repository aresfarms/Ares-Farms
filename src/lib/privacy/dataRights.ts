/**
 * dataRights — the person's rights over their own data (founder directive
 * 2026-08-06: "make us even more compliant than Europe requires… people need
 * to trust us with their data").
 *
 * WHY THIS EXISTS, stated precisely: the vault's PROTECTION already meets or
 * exceeds GDPR Article 32 (customer-managed encryption keys, IAM-only access,
 * audited single-file reads, malware quarantine, rate limiting, minimum-
 * disclosure messaging). But GDPR is not primarily a security standard — most
 * of it is about a PERSON'S RIGHTS over their data, which no amount of
 * encryption satisfies. This module is that half:
 *
 *   Art. 15 — right of access      → completeRecordFor()
 *   Art. 20 — data portability     → machine-readable JSON export
 *   Art. 16 — rectification        → correction request, human-reviewed
 *   Art. 17 — erasure              → requestErasure() (see the design note)
 *   Art. 5(1)(e) — storage limits  → retention posture stated per record type
 *
 * THE ERASURE / IMMUTABLE-LEDGER PROBLEM — and why this platform can actually
 * solve it. Erasure appears to conflict with an append-only audit ledger and
 * a hash chain that must never be rewritten. The resolution, which the
 * architecture already supports:
 *   · DOCUMENT BYTES are erased for real — and because each vault is
 *     encrypted under its own customer-managed key, destroying the key
 *     ("crypto-shredding") renders any residual copy unrecoverable.
 *   · IDENTIFIERS in the deal record are redacted in place.
 *   · The LEDGER is never rewritten — but it holds only hashes, event types,
 *     and timestamps. Once the identifiers are redacted, what remains is no
 *     longer personal data: it proves that handling occurred without
 *     revealing whose. History stays intact; the person disappears from it.
 * That is the honest reconciliation, and it is stronger than deleting rows
 * and hoping backups agree.
 *
 * AUTHENTICATION: the same minimum-disclosure proof used everywhere else —
 * the request reference plus the email on that request. A person can only
 * ever reach their own record, and nothing here reveals whether a reference
 * exists to someone who cannot match its email.
 *
 * Master Volume Governance: Vol II (controlled disclosure, consent), Vol V
 * (evidence preservation, classification), Vol IV (human-review boundary —
 * erasure and rectification are recorded requests, never silent automated
 * mutations of a regulated lending file).
 */

import { desc, eq } from "drizzle-orm";

import { applicationDocuments, serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";

const MODULE = "lib.privacy.dataRights";

export interface HeldDataCategory {
  category: string;
  whatWeHold: string;
  whyWeHold: string;
  retention: string;
  items: Array<Record<string, unknown>>;
}

export interface CompleteRecord {
  dealRef: string;
  generatedAt: string;
  categories: HeldDataCategory[];
  notCollected: string[];
}

/**
 * Everything the platform holds about the person behind one request.
 * Returns null when the reference and email do not match — the same silence
 * a wrong lookup gets, so this cannot be used to probe for valid references.
 */
export async function completeRecordFor(
  dealRef: string,
  email: string
): Promise<CompleteRecord | null> {
  const ref = dealRef.trim();
  const mail = email.trim().toLowerCase();
  if (!ref || !mail) return null;

  const rows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.serviceRequestId, ref))
    .limit(1);
  const deal = rows[0];
  if (!deal || (deal.contactEmail ?? "").trim().toLowerCase() !== mail) return null;

  const metadata = (deal.metadata ?? {}) as Record<string, unknown>;
  const mailing = (metadata.mailingAddress ?? null) as Record<string, unknown> | null;
  const desk = (metadata.dealDesk ?? null) as Record<string, unknown> | null;

  const docs = await db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, `finintake-${ref}`))
    .orderBy(desc(applicationDocuments.receivedAt));

  const categories: HeldDataCategory[] = [
    {
      category: "Who you are",
      whatWeHold: "The contact details you typed on your financing request.",
      whyWeHold: "To route your request to the broker and to reach you about it.",
      retention: "Kept while the request is open, then per the lending file's retention policy.",
      items: [
        {
          name: deal.contactName,
          email: deal.contactEmail,
          phone: deal.contactPhone,
          mailingAddress: mailing,
        },
      ],
    },
    {
      category: "What you asked about",
      whatWeHold: "The property, location and scope you described — never a credit decision.",
      whyWeHold: "To screen the property against public financing-program rules.",
      retention: "Kept with the request record.",
      items: [
        {
          property: deal.propertyDescriptor,
          state: deal.locationState,
          county: deal.locationCounty,
          scope: deal.scopeSummary,
          estimatedProjectSize: deal.estimatedValue,
          submittedAt: deal.occurredAt?.toISOString() ?? null,
          status: deal.status,
        },
      ],
    },
    {
      category: "Documents you uploaded",
      whatWeHold:
        "The files themselves, held encrypted, plus their names, sizes, fingerprints and scan results. " +
        "Contents are never reproduced in this export — you already hold them, and repeating them here " +
        "would create a second copy outside the vault.",
      whyWeHold: "Because your broker needs them to work your financing request.",
      retention: "Erasable on request once the request is closed (see below).",
      items: docs
        .filter((d) => d.source !== "signature-vault")
        .map((d) => {
          const m = (d.metadata ?? {}) as Record<string, unknown>;
          return {
            fileName: d.fileName,
            documentType: d.documentType,
            receivedAt: d.receivedAt?.toISOString() ?? null,
            sizeBytes: d.byteSize,
            fingerprintSha256: d.checksum,
            malwareScan: m.scanStatus ?? "pending",
          };
        }),
    },
    {
      category: "Anything you signed",
      whatWeHold:
        "For each electronic signature: the name you typed, the moment you signed, your network " +
        "address and browser, the exact document's fingerprint, and the version of the consent " +
        "language you agreed to.",
      whyWeHold:
        "This IS the signature — without it the signature could not be proven, which would harm you, " +
        "not protect you.",
      retention:
        "Retained as long as the signed document has legal effect; not erasable while it does.",
      items: docs
        .filter((d) => d.documentType === "signature-certificate")
        .map((d) => {
          const m = (d.metadata ?? {}) as Record<string, unknown>;
          return { certificate: d.fileName, event: m.signatureEvent ?? null };
        }),
    },
    {
      category: "What your broker wrote to you",
      whatWeHold: "Status notes and the closing timeline shown on your status page.",
      whyWeHold: "So you can see where your request stands without having to ask.",
      retention: "Kept with the request record.",
      items: desk ? [desk] : [],
    },
  ];

  return {
    dealRef: ref,
    generatedAt: new Date().toISOString(),
    categories,
    notCollected: [
      "Race, ethnicity, sex, age, or any other demographic characteristic — never collected, by design (Section 1071 firewall).",
      "Your browsing of the public site — property exploration is anonymous and is never tied to you.",
      "Social Security numbers or government ID numbers — not collected by this platform today.",
      "Your bank credentials — the platform never asks for them and never will.",
      "Any profile assembled about you from outside sources.",
    ],
  };
}

export type RightsRequestType = "erasure" | "rectification" | "restriction";

/**
 * Record a rights request for human action. DELIBERATELY NOT AUTOMATED: a
 * regulated lending file may not be silently mutated or destroyed by an
 * unauthenticated web request, and some records (a signature that still has
 * legal effect, a document a lender relied on) cannot lawfully be erased on
 * demand. The request is recorded with durable evidence and answered by a
 * human within the statutory window.
 */
export async function requestDataRight(args: {
  dealRef: string;
  email: string;
  type: RightsRequestType;
  detail: string | null;
}): Promise<{ recorded: boolean; reference: string | null }> {
  const record = await completeRecordFor(args.dealRef, args.email);
  if (!record) return { recorded: false, reference: null };

  const traceId = `data-rights-${args.type}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const rows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.serviceRequestId, args.dealRef.trim()))
    .limit(1);
  const deal = rows[0];
  if (!deal) return { recorded: false, reference: null };

  const metadata = (deal.metadata ?? {}) as Record<string, unknown>;
  const existing = Array.isArray(metadata.dataRightsRequests)
    ? (metadata.dataRightsRequests as unknown[])
    : [];
  const entry = {
    reference: traceId,
    type: args.type,
    detail: args.detail?.slice(0, 2000) ?? null,
    requestedAt: new Date().toISOString(),
    status: "PENDING_HUMAN_REVIEW",
  };
  await db
    .update(serviceRequests)
    .set({
      metadata: { ...metadata, dataRightsRequests: [...existing, entry] },
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.serviceRequestId, args.dealRef.trim()));

  const observability = createObservabilityEvent({
    eventType: "DATA_RIGHTS_REQUEST",
    domain: "security",
    severity: "INFO",
    message: `A data-rights request (${args.type}) was recorded for human review.`,
    traceId,
    replayRef: traceId,
    actorId: `customer-via-status-link:${args.dealRef}`,
    module: MODULE,
    metadata: { dealRef: args.dealRef, type: args.type },
  });
  await persistGovernanceEvidence({
    traceId,
    replayRef: traceId,
    observability,
    metadata: { route: "data-rights", dealRef: args.dealRef, type: args.type },
  });

  return { recorded: true, reference: traceId };
}
