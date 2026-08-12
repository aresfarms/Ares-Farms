/**
 * signatureVault — portal-native electronic signing on the portal's OWN
 * documents (founder-approved 2026-08-06; ESIGN/UETA process design).
 *
 * Legal shape (the five things that make an e-signature bind):
 *   1. Consent to do business electronically — captured, versioned text.
 *   2. Intent to sign — explicit statement + typed legal name.
 *   3. Attribution — the signer reached the ceremony through the ref+email
 *      status lookup; signer IP + typed name recorded.
 *   4. Record integrity — the signed document's SHA-256 is computed from the
 *      exact vault bytes at signing time and bound into the certificate.
 *   5. Copies — certificate lands in the vault, visible to both parties;
 *      both are notified.
 *
 * MODE: "test" until counsel reviews the consent/attribution language
 * (SIGNATURE_MODE=live flips it after that review — founder + counsel
 * decision, never code's). Test-mode ceremonies say so on the page and
 * stamp TEST MODE on the certificate. Closing documents (notes, mortgages,
 * deeds — anything notarized/recorded) are permanently out of scope.
 *
 * Master Volume Governance: Vol II regulated-document boundaries + consent;
 * Vol III deterministic hashing + stateless tokens; Vol V evidence, audit,
 * classification via the governed document stores.
 */

import { createHash } from "node:crypto";
import PDFDocument from "pdfkit";

import { fetchObjectStream, objectKeyFromStorageUri } from "./gcsResumableUpload";

export const ESIGN_CONSENT_VERSION = "esign-consent-v1-precounsel";

export const ESIGN_CONSENT_TEXT =
  "I agree to conduct this transaction electronically and to sign this document " +
  "electronically. I have been able to view the exact document I am signing. I " +
  "understand that my typed name, the date and time, my network address, and a " +
  "digital fingerprint of the document will be recorded together as my signature, " +
  "and that I may request a paper copy of the signed record at any time.";

export const ESIGN_INTENT_TEXT =
  "By typing my full legal name below and selecting Sign, I intend to sign this " +
  "document and agree to be bound by it, exactly as if I had signed it by hand.";

export function signatureMode(): "test" | "live" {
  // Volume VII forbids environment-variable activation. Live signing requires
  // a reviewed promotion record, certified provider and approved legal overlay.
  return "test";
}

/** SHA-256 of the exact vault bytes, streamed (never bytes-in-memory-forever). */
export async function sha256OfVaultObject(storageUri: string | null): Promise<string | null> {
  const objectKey = objectKeyFromStorageUri(storageUri);
  if (!objectKey) return null;
  const object = await fetchObjectStream(objectKey);
  if (!object) return null;
  const hash = createHash("sha256");
  const reader = object.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) hash.update(value);
  }
  return hash.digest("hex");
}

export interface SignatureEvent {
  dealRef: string;
  documentId: string;
  documentFileName: string;
  documentSha256: string | null;
  signerTypedName: string;
  signerIp: string;
  signerUserAgent: string;
  signedAtIso: string;
  consentVersion: string;
  mode: "test" | "live";
}

/** Render the signature certificate PDF (the durable, human-readable proof). */
export function buildSignatureCertificatePdf(event: SignatureEvent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 64, bottom: 64, left: 64, right: 64 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const NAVY = "#1C2B45";
    const GOLD = "#b8862f";
    const MUTED = "#4d596d";

    doc.font("Times-Bold").fontSize(20).fillColor(NAVY).text("Electronic Signature Certificate", { align: "center" });
    doc.moveDown(0.3);
    doc.font("Times-Roman").fontSize(11).fillColor(GOLD).text("Furlong — Compass to Capital · Sovereign Document Vault", { align: "center" });
    if (event.mode === "test") {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#9a3412").text(
        "TEST MODE — this ceremony ran before counsel review of the consent language and is not a legally operative signature.",
        { align: "center" }
      );
    }
    doc.moveDown(1.2);

    const row = (label: string, value: string) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text(label.toUpperCase(), { continued: false });
      doc.font("Times-Roman").fontSize(12.5).fillColor(NAVY).text(value);
      doc.moveDown(0.6);
    };
    row("Financing request", event.dealRef);
    row("Document signed", event.documentFileName);
    row("Document fingerprint (SHA-256 of the exact vault bytes at signing)", event.documentSha256 ?? "unavailable in this environment");
    row("Signed by (typed legal name)", event.signerTypedName);
    row("Signed at (UTC)", event.signedAtIso);
    row("Signer network address", event.signerIp);
    row("Signer browser & device", event.signerUserAgent);
    row("Consent language version", event.consentVersion);

    doc.moveDown(0.6);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("CONSENT RECORDED");
    doc.font("Times-Italic").fontSize(11).fillColor(NAVY).text(ESIGN_CONSENT_TEXT);
    doc.moveDown(0.5);
    doc.font("Times-Italic").fontSize(11).fillColor(NAVY).text(ESIGN_INTENT_TEXT);
    doc.moveDown(1);
    doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(
      "The signer reached this ceremony through the portal's authenticated status lookup " +
        "(reference number + matching email). This certificate, the signature event, and the audit " +
        "trail are retained in the governed vault; any alteration of the signed document after this " +
        "moment will no longer match the fingerprint above.",
      { lineGap: 2 }
    );
    doc.end();
  });
}
