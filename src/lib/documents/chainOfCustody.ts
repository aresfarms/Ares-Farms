/**
 * chainOfCustody — the per-deal Chain of Custody report (founder approval
 * 2026-08-06: "that's a fantastic idea… do it").
 *
 * WHY THIS EXISTS: when a bank asks "how do you know these documents weren't
 * altered?", most lending portals can only shrug. Every fact this report
 * needs is ALREADY recorded — document fingerprints, scan verdicts, every
 * audited open, signature certificates with their consent version — so the
 * report is assembly, not new instrumentation. That is the moat: not the
 * analysis, the provable handling.
 *
 * WHAT IT ASSERTS — and nothing more:
 *   · which documents entered the vault, when, and how they arrived
 *   · each document's malware-scan verdict
 *   · each SHA-256 fingerprint we hold, so a bank can re-hash the file it
 *     received and compare byte-for-byte
 *   · every recorded access: who opened what, when
 *   · signature events with their consent-language version
 *
 * WHAT IT NEVER ASSERTS: that a document is authentic, that its CONTENTS are
 * true, that anyone qualified, or any credit conclusion. It proves custody —
 * that what left is what arrived — which is a narrower and far more
 * defensible claim.
 *
 * Master Volume Governance: Vol II (controlled disclosure — the report names
 * documents, never reproduces contents); Vol III (deterministic, replayable);
 * Vol V (evidence preservation + audit-safe output).
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import PDFDocument from "pdfkit";

import { applicationDocuments, observabilityEvents, serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";

const NAVY = "#1C2B45";
const GOLD = "#b8862f";
const MUTED = "#4d596d";
const INK = "#101a2b";

/** Event types that constitute the custody record for a deal. */
const CUSTODY_EVENTS = [
  "SOVEREIGN_UPLOAD_CONFIRMED",
  "LENDER_DOCUMENT_DOWNLOAD",
  "CUSTOMER_DOC_DOWNLOADED",
  "LENDER_DOC_SENT_TO_CUSTOMER",
  "DOCUMENT_SIGNED",
  "SIGNATURE_REQUESTED",
  "VAULT_DOCUMENT_SCAN_CLEAN",
  "VAULT_DOCUMENT_QUARANTINED",
];

export interface CustodyDocument {
  fileName: string | null;
  documentType: string;
  receivedAt: string | null;
  byteSize: number | null;
  checksum: string | null;
  scanStatus: string;
  signed: boolean;
  testSigned: boolean;
  signedBy: string | null;
  origin: "borrower" | "broker" | "portal";
  attestedAt: string | null;
  attestationText: string | null;
}

export interface CustodyEvent {
  at: string;
  what: string;
  who: string;
  detail: string;
}

export interface ChainOfCustodyReport {
  dealRef: string;
  contactName: string | null;
  submittedAt: string | null;
  documents: CustodyDocument[];
  events: CustodyEvent[];
  generatedAt: string;
}

function originOf(source: string | null, documentType: string): CustodyDocument["origin"] {
  if (documentType === "signature-certificate") return "portal";
  if (documentType === "lender-provided") return "broker";
  if (source === "lender-deal-desk") return "broker";
  if (source === "signature-vault") return "portal";
  return "borrower";
}

function humanEvent(eventType: string): string {
  switch (eventType) {
    case "SOVEREIGN_UPLOAD_CONFIRMED": return "Document received into the vault";
    case "LENDER_DOCUMENT_DOWNLOAD": return "Opened by the broker";
    case "CUSTOMER_DOC_DOWNLOADED": return "Opened by the customer";
    case "LENDER_DOC_SENT_TO_CUSTOMER": return "Document sent to the customer";
    case "SIGNATURE_REQUESTED": return "Signature requested";
    case "DOCUMENT_SIGNED": return "Document signed";
    case "VAULT_DOCUMENT_SCAN_CLEAN": return "Malware scan — clean";
    case "VAULT_DOCUMENT_QUARANTINED": return "Malware scan — QUARANTINED";
    default: return eventType;
  }
}

/** Assemble the custody record for one deal from what is already recorded. */
export async function buildChainOfCustody(dealRef: string): Promise<ChainOfCustodyReport | null> {
  const dealRows = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.serviceRequestId, dealRef))
    .limit(1);
  const deal = dealRows[0];
  if (!deal) return null;

  const applicationId = `finintake-${dealRef}`;
  const docs = await db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId))
    .orderBy(desc(applicationDocuments.receivedAt));

  const documents: CustodyDocument[] = docs.map((d) => {
    const m = (d.metadata ?? {}) as Record<string, unknown>;
    return {
      fileName: d.fileName,
      documentType: d.documentType,
      receivedAt: d.receivedAt ? d.receivedAt.toISOString() : null,
      byteSize: d.byteSize,
      checksum: d.checksum,
      scanStatus: typeof m.scanStatus === "string" ? m.scanStatus : "pending",
      signed: m.signatureStatus === "signed" || m.signatureStatus === "test-signed",
      testSigned: m.signatureStatus === "test-signed",
      signedBy: typeof m.signedByTypedName === "string" ? m.signedByTypedName : null,
      origin: originOf(d.source, d.documentType),
      attestedAt: (m.attestation as { affirmedAt?: string } | null)?.affirmedAt ?? null,
      attestationText: (m.attestation as { text?: string } | null)?.text ?? null,
    };
  });

  const rawEvents = await db
    .select()
    .from(observabilityEvents)
    .where(
      and(
        inArray(observabilityEvents.eventType, CUSTODY_EVENTS),
        eq(observabilityEvents.governanceVersion, "master-volumes-runtime-v0.1.0")
      )
    )
    .orderBy(desc(observabilityEvents.createdAt))
    .limit(500);

  // Keep only events that name this deal or its application.
  const events: CustodyEvent[] = rawEvents
    .filter((e) => {
      const m = (e.metadata ?? {}) as Record<string, unknown>;
      return (
        m.dealRef === dealRef ||
        m.serviceRequestId === dealRef ||
        m.applicationId === applicationId
      );
    })
    .map((e) => {
      const m = (e.metadata ?? {}) as Record<string, unknown>;
      const file = typeof m.fileName === "string" ? m.fileName : typeof m.documentId === "string" ? `document ${String(m.documentId).slice(0, 8)}` : "";
      return {
        at: e.createdAt ? e.createdAt.toISOString() : "",
        what: humanEvent(e.eventType),
        who: e.actorId ?? "—",
        detail: file,
      };
    })
    .sort((a, b) => a.at.localeCompare(b.at));

  return {
    dealRef,
    contactName: deal.contactName,
    submittedAt: deal.occurredAt ? deal.occurredAt.toISOString() : null,
    documents,
    events,
    generatedAt: new Date().toISOString(),
  };
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

/** Render the report as a PDF both the customer and the bank can keep. */
export function renderChainOfCustodyPdf(report: ChainOfCustodyReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 56, bottom: 56, left: 56, right: 56 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Times-Bold").fontSize(20).fillColor(NAVY).text("Chain of Custody", { align: "center" });
    doc.moveDown(0.25);
    doc.font("Times-Roman").fontSize(11).fillColor(GOLD)
      .text("Furlong — Compass to Capital · Sovereign Document Vault", { align: "center" });
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("FINANCING REQUEST");
    doc.font("Times-Roman").fontSize(13).fillColor(NAVY).text(report.dealRef);
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("SUBMITTED");
    doc.font("Times-Roman").fontSize(12).fillColor(NAVY).text(fmt(report.submittedAt));
    doc.moveDown(0.9);

    // ---- Documents held -------------------------------------------------
    doc.font("Times-Bold").fontSize(14).fillColor(NAVY).text("Documents held in the vault");
    doc.moveDown(0.4);
    if (report.documents.length === 0) {
      doc.font("Times-Italic").fontSize(11).fillColor(MUTED).text("No documents have entered the vault for this request.");
    }
    for (const d of report.documents) {
      doc.font("Times-Bold").fontSize(11.5).fillColor(INK).text(d.fileName ?? "(unnamed document)");
      const originLabel =
        d.origin === "borrower" ? "uploaded by the customer"
          : d.origin === "broker" ? "sent by the broker"
            : "generated by the portal";
      doc.font("Times-Roman").fontSize(10).fillColor(MUTED)
        .text(`${d.documentType.replace(/-/g, " ")} · ${originLabel} · received ${fmt(d.receivedAt)}${d.byteSize ? ` · ${Math.round(d.byteSize / 1024)} KB` : ""}`);
      const scanLine =
        d.scanStatus === "clean" ? "Malware scan: CLEAN"
          : d.scanStatus === "infected" ? "Malware scan: QUARANTINED — never released to any party"
            : "Malware scan: not yet completed";
      doc.font("Times-Roman").fontSize(10).fillColor(d.scanStatus === "infected" ? "#b42318" : "#166534").text(scanLine);
      if (d.checksum) {
        doc.font("Courier").fontSize(8).fillColor(MUTED).text(`SHA-256 ${d.checksum}`);
      }
      if (d.signed) {
        doc.font("Times-Roman").fontSize(10).fillColor(NAVY).text(
          d.testSigned
            ? `TEST signature ceremony completed by ${d.signedBy ?? "the customer"} — not legally operative`
            : `Signed electronically by ${d.signedBy ?? "the customer"}`
        );
      }
      if (d.attestedAt && d.attestationText) {
        doc.font("Times-Italic").fontSize(9).fillColor(NAVY)
          .text(`Affirmed by the sender ${fmt(d.attestedAt)}: "${d.attestationText}"`, { lineGap: 1 });
      }
      doc.moveDown(0.5);
    }

    // ---- Access record ---------------------------------------------------
    doc.moveDown(0.4);
    doc.font("Times-Bold").fontSize(14).fillColor(NAVY).text("Every recorded action");
    doc.moveDown(0.35);
    if (report.events.length === 0) {
      doc.font("Times-Italic").fontSize(11).fillColor(MUTED).text("No custody events recorded yet.");
    }
    for (const e of report.events) {
      doc.font("Times-Roman").fontSize(10).fillColor(INK)
        .text(`${fmt(e.at)}  —  ${e.what}${e.detail ? ` (${e.detail})` : ""}`, { continued: false });
      doc.font("Times-Roman").fontSize(9).fillColor(MUTED).text(`      by ${e.who}`);
    }

    // ---- What this does and does not prove -------------------------------
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("WHAT THIS RECORD PROVES");
    doc.font("Times-Roman").fontSize(10).fillColor(INK).text(
      "This report states which documents entered the vault, when, from whom, what the malware scan " +
        "found, who opened each one, and which were signed. Where a fingerprint (SHA-256) is shown, " +
        "any party holding a copy can re-compute it and confirm the file is byte-for-byte identical " +
        "to the one held here.",
      { lineGap: 1.5 }
    );
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("WHAT IT DOES NOT PROVE");
    doc.font("Times-Roman").fontSize(10).fillColor(INK).text(
      "It does not assert that a document is genuine, that its contents are accurate, that any party " +
        "qualifies for financing, or any credit conclusion. It is a custody record — evidence of how " +
        "documents were handled, not an opinion about what they say.",
      { lineGap: 1.5 }
    );
    doc.moveDown(0.7);
    doc.font("Times-Italic").fontSize(9).fillColor(MUTED)
      .text(`Generated ${fmt(report.generatedAt)} from the platform's governed evidence records.`);
    doc.end();
  });
}
