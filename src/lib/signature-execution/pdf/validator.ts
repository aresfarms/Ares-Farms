import { PDFDocument } from "pdf-lib";
import { signatureCanonicalJson, signatureSha256 } from "../canonical";
import type { SignaturePlacementPlan } from "./placementPlanner";

export async function validateExecutedPdf(input: { sourceBytes: Uint8Array; executedBytes: Uint8Array; plan: SignaturePlacementPlan }) {
  const source = await PDFDocument.load(input.sourceBytes, { updateMetadata: false });
  const executed = await PDFDocument.load(input.executedBytes, { updateMetadata: false });
  const sourceBoxes = source.getPages().map((p) => [p.getWidth(), p.getHeight(), p.getRotation().angle]);
  const executedBoxes = executed.getPages().slice(0, source.getPageCount()).map((p) => [p.getWidth(), p.getHeight(), p.getRotation().angle]);
  const issues: string[] = [];
  if (signatureSha256(input.sourceBytes) !== input.plan.documentSha256) issues.push("SIG_DOC_HASH_MISMATCH");
  if (signatureCanonicalJson(sourceBoxes) !== signatureCanonicalJson(executedBoxes)) issues.push("SOURCE_PAGE_GEOMETRY_CHANGED");
  const expectedPages = source.getPageCount() + (input.plan.appendExecutionPage ? 1 : 0);
  if (executed.getPageCount() !== expectedPages) issues.push("UNEXPECTED_PAGE_COUNT");
  if (!input.executedBytes.length) issues.push("EMPTY_EXECUTED_PDF");
  const executedSha256 = signatureSha256(input.executedBytes);
  return { valid: issues.length === 0, issues, sourceSha256: input.plan.documentSha256, executedSha256, pageCount: executed.getPageCount(), reportSha256: signatureSha256(signatureCanonicalJson({ issues, executedSha256, expectedPages })) };
}
