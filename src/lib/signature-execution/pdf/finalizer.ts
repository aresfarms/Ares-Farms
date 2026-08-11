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
  /**
   * PER-PAGE EXECUTION BAND — founder direction 2026-08-11.
   *
   * Until this existed, only ONE page of an executed document carried any
   * evidence of execution: the stamped zone on a Furlong-authored form, or the
   * appended execution page on a third-party instrument. Every other page was
   * indistinguishable from the unsigned original.
   *
   * That is the alteration vector. A page lifted out of the middle of a
   * forty-page loan agreement, or a substituted page slipped back in, carries
   * nothing that contradicts it — and the resulting document still looks
   * executed because the signature page is untouched. Founder's words: "that's
   * exactly how documents get altered unknowingly."
   *
   * Each page now carries, in its own footer:
   *   · the execution id           — ties the page to one ceremony
   *   · the signer and date        — states who executed it
   *   · the SOURCE document hash   — binds the page to a specific original,
   *                                  so a page from a different document is
   *                                  visibly foreign
   *   · PAGE n OF m                — makes a REMOVED page detectable, which a
   *                                  per-page mark alone cannot do. This is the
   *                                  stronger half of the control: altering by
   *                                  deletion leaves the remaining pages
   *                                  truthful but the count wrong.
   *   · the test-mode stamp        — never let a ceremony read as operative
   *
   * PLACEMENT: 16pt from the bottom edge, inside the ~36pt margin that
   * virtually every generated document and word processor reserves. On an
   * arbitrary third-party PDF that cannot be *guaranteed* clear the way the
   * planner certifies the signature zone, so this is a deliberate trade: a
   * small risk of visual overlap in the extreme bottom margin, against the
   * certainty of unmarked pages. The band is drawn at 6pt in grey so that if
   * it ever does land over content, it reads as an overlay rather than
   * obscuring the text beneath.
   */
  const pages = document.getPages();
  const pageCount = pages.length;
  const shortSource = input.evidence.sourceSha256.slice(0, 16);
  const shortDate = input.evidence.signedAtIso.slice(0, 10);
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const band =
      `FURLONG EXECUTED · ${input.evidence.executionId} · ${input.evidence.signerName}` +
      ` · ${shortDate} · src ${shortSource} · PAGE ${index + 1} OF ${pageCount}` +
      ` · OFFLINE TEST — NOT LEGALLY OPERATIVE`;
    page.drawText(band, {
      x: 36,
      y: 16,
      size: 6,
      font: regular,
      color: rgb(0.35, 0.35, 0.4),
      maxWidth: width - 72,
    });
  });

  document.setProducer("Furlong governed offline execution engine v1");
  document.setSubject(`Execution ${input.evidence.executionId}; source ${input.evidence.sourceSha256}; offline test only`);
  const bytes = await document.save({ useObjectStreams: false, addDefaultPage: false });
  return { bytes, executedSha256: signatureSha256(bytes), canonicalSinglePdf: true as const, mode: "OFFLINE_TEST" as const };
}
