import { PDFDocument } from "pdf-lib";
import { signatureCanonicalJson, signatureSha256 } from "../canonical";
import type { SignatureBlockerCode } from "../blockers";

export type PdfPageGeometry = {
  pageIndex: number; width: number; height: number; rotation: number;
  mediaBox: { x: number; y: number; width: number; height: number };
  cropBox: { x: number; y: number; width: number; height: number };
};

export type SignaturePdfAnalysis = {
  analyzerVersion: "signature-pdf-analyzer-v1"; sourceSha256: string; byteLength: number;
  encrypted: boolean; parseable: boolean; pageCount: number; pages: PdfPageGeometry[]; pageBoxesHash: string;
  formFieldNames: string[]; hasAcroForm: boolean; hasExistingSignature: boolean; hasCertificationSignature: boolean;
  hasEmbeddedFiles: boolean; hasJavaScript: boolean; hasLaunchActions: boolean; hasSuspiciousAnnotations: boolean;
  malwareStatus: "CLEAN" | "PENDING" | "INFECTED" | "UNAVAILABLE";
  blockerCodes: SignatureBlockerCode[]; safeForOfflinePlanning: boolean;
};

function contains(bytes: Uint8Array, pattern: RegExp): boolean {
  return pattern.test(Buffer.from(bytes).toString("latin1"));
}

export async function analyzeSignaturePdf(input: { bytes: Uint8Array; malwareStatus: SignaturePdfAnalysis["malwareStatus"] }): Promise<SignaturePdfAnalysis> {
  const blockerCodes: SignatureBlockerCode[] = [];
  const sourceSha256 = signatureSha256(input.bytes);
  const encrypted = contains(input.bytes, /\/Encrypt\b/);
  const hasExistingSignature = contains(input.bytes, /\/ByteRange\s*\[|\/FT\s*\/Sig\b/);
  const hasCertificationSignature = contains(input.bytes, /\/DocMDP\b|\/Reference\s*\[[\s\S]{0,500}\/TransformMethod\s*\/DocMDP/);
  const hasEmbeddedFiles = contains(input.bytes, /\/EmbeddedFile\b|\/EmbeddedFiles\b/);
  const hasJavaScript = contains(input.bytes, /\/JavaScript\b|\/S\s*\/JavaScript\b|\/JS\s*[<(]/);
  const hasLaunchActions = contains(input.bytes, /\/S\s*\/Launch\b|\/Launch\b/);
  const hasSuspiciousAnnotations = contains(input.bytes, /\/Subtype\s*\/(RichMedia|Movie|Sound|Screen|FileAttachment)\b/);
  let document: PDFDocument;
  try {
    document = await PDFDocument.load(input.bytes, { ignoreEncryption: false, updateMetadata: false, throwOnInvalidObject: true });
  } catch {
    return { analyzerVersion: "signature-pdf-analyzer-v1", sourceSha256, byteLength: input.bytes.length, encrypted, parseable: false, pageCount: 0, pages: [], pageBoxesHash: signatureSha256("[]"), formFieldNames: [], hasAcroForm: false, hasExistingSignature, hasCertificationSignature, hasEmbeddedFiles, hasJavaScript, hasLaunchActions, hasSuspiciousAnnotations, malwareStatus: input.malwareStatus, blockerCodes: ["SIG_DOC_UNSUPPORTED"], safeForOfflinePlanning: false };
  }
  const pages = document.getPages().map((page, pageIndex) => {
    const mediaBox = page.getMediaBox(); const cropBox = page.getCropBox();
    return { pageIndex, width: page.getWidth(), height: page.getHeight(), rotation: page.getRotation().angle, mediaBox, cropBox };
  });
  let formFieldNames: string[] = [];
  try { formFieldNames = document.getForm().getFields().map((field) => field.getName()).sort(); } catch { blockerCodes.push("SIG_DOC_UNSUPPORTED"); }
  if (encrypted || hasEmbeddedFiles || hasJavaScript || hasLaunchActions || hasSuspiciousAnnotations) blockerCodes.push("SIG_DOC_UNSUPPORTED");
  if (hasExistingSignature || hasCertificationSignature) blockerCodes.push("SIG_EXISTING_SIGNATURE_CONFLICT");
  if (input.malwareStatus !== "CLEAN") blockerCodes.push("SIG_DOC_UNSUPPORTED");
  const uniqueBlockers = [...new Set(blockerCodes)];
  return { analyzerVersion: "signature-pdf-analyzer-v1", sourceSha256, byteLength: input.bytes.length, encrypted, parseable: true, pageCount: pages.length, pages, pageBoxesHash: signatureSha256(signatureCanonicalJson(pages)), formFieldNames, hasAcroForm: formFieldNames.length > 0, hasExistingSignature, hasCertificationSignature, hasEmbeddedFiles, hasJavaScript, hasLaunchActions, hasSuspiciousAnnotations, malwareStatus: input.malwareStatus, blockerCodes: uniqueBlockers, safeForOfflinePlanning: uniqueBlockers.length === 0 && pages.length > 0 };
}
