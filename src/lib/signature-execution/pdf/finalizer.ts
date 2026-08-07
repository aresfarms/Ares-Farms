import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { signatureSha256 } from "../canonical";
import type { SignaturePlacementPlan } from "./placementPlanner";

export type OfflineExecutionEvidence = {
  executionId: string; signerName: string; capacity: string; representedParty?: string;
  signedAtIso: string; timezone: string; sourceSha256: string; authorityRef: string;
  consentRef: string; intentRef: string; reviewRef: string; captureRef: string;
};

export async function finalizeOfflineExecutedPdf(input: { sourceBytes: Uint8Array; plan: SignaturePlacementPlan; evidence: OfflineExecutionEvidence }) {
  if (signatureSha256(input.sourceBytes) !== input.plan.documentSha256 || input.evidence.sourceSha256 !== input.plan.documentSha256) throw new Error("SIG_DOC_HASH_MISMATCH");
  if (input.plan.blockerCodes.length || !input.plan.collisionFree) throw new Error(input.plan.blockerCodes[0] ?? "SIG_PLACEMENT_COLLISION");
  const document = await PDFDocument.load(input.sourceBytes, { updateMetadata: false });
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  if (input.plan.profile === "FURLONG_AUTHORED") {
    if (!input.plan.zone) throw new Error("SIG_ZONE_MISSING");
    const page = document.getPage(input.plan.zone.pageIndex);
    const { x, y, width, height } = input.plan.zone;
    page.drawRectangle({ x, y, width, height, borderWidth: 0.75, borderColor: rgb(0.11, 0.17, 0.27) });
    page.drawText("OFFLINE TEST SIGNATURE — NOT LEGALLY OPERATIVE", { x: x + 8, y: y + height - 16, size: 7.5, font: bold, color: rgb(0.6, 0.2, 0.05), maxWidth: width - 16 });
    page.drawText(input.evidence.signerName, { x: x + 8, y: y + 32, size: 15, font: regular, maxWidth: width - 16 });
    page.drawText(`${input.evidence.capacity} · ${input.evidence.signedAtIso}`, { x: x + 8, y: y + 12, size: 7, font: regular, maxWidth: width - 16 });
  } else {
    const page = document.addPage([612, 792]);
    const lines = [
      "FURLONG SIGNATURE AND EXECUTION PAGE", "OFFLINE TEST — NOT LEGALLY OPERATIVE", "",
      `Execution ID: ${input.evidence.executionId}`, `Signed by: ${input.evidence.signerName}`,
      `Capacity: ${input.evidence.capacity}`, `Represented party: ${input.evidence.representedParty ?? "Self"}`,
      `Signed at: ${input.evidence.signedAtIso} (${input.evidence.timezone})`, "",
      "This page is appended inside the same PDF as the preserved third-party instrument.",
      `Source document SHA-256: ${input.evidence.sourceSha256}`, `Authority evidence: ${input.evidence.authorityRef}`,
      `Electronic-process consent: ${input.evidence.consentRef}`, `Intent evidence: ${input.evidence.intentRef}`,
      `Human review evidence: ${input.evidence.reviewRef}`, `Signature capture evidence: ${input.evidence.captureRef}`,
      "Execution is complete only after structural and visual validation of this single PDF.",
    ];
    let y = 720;
    for (const [index, line] of lines.entries()) {
      page.drawText(line, { x: 54, y, size: index === 0 ? 16 : index === 1 ? 10 : 9, font: index < 2 ? bold : regular, maxWidth: 504, lineHeight: 13 });
      y -= index < 2 ? 26 : 22;
    }
  }
  document.setProducer("Furlong governed offline execution engine v1");
  document.setSubject(`Execution ${input.evidence.executionId}; source ${input.evidence.sourceSha256}; offline test only`);
  const bytes = await document.save({ useObjectStreams: false, addDefaultPage: false });
  return { bytes, executedSha256: signatureSha256(bytes), canonicalSinglePdf: true as const, mode: "OFFLINE_TEST" as const };
}
