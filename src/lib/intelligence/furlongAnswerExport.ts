import { createHash } from "node:crypto";
import PDFDocument from "pdfkit";
import { furlongAnswerHtml, type FurlongAnswer } from "@/lib/property/furlongAnswer";

export const ANSWER_EXPORT_VERSION = "furlong-answer-export-v1.0.0";
export const ANSWER_EXPORT_CONSENT = "furlong-answer-personal-download-v1";
export const sha256 = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
type File = { name: string; bytes: Buffer; contentType: string };

/** TECH-EXPORT-001: deterministic ZIP with fixed entry timestamps. No external
 * inputs become paths. STORE compression preserves exact manifest bytes. */
export function answerZip(files: File[]): Buffer {
  const local: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) throw new Error("Invalid package filename.");
    const name = Buffer.from(file.name);
    let crc = 0xffffffff;
    for (const byte of file.bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4);
    header.writeUInt16LE(33, 12); // 1980-01-01
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(file.bytes.length, 18);
    header.writeUInt32LE(file.bytes.length, 22); header.writeUInt16LE(name.length, 26);
    local.push(header, name, file.bytes);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(33, 14); directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(file.bytes.length, 20); directory.writeUInt32LE(file.bytes.length, 24);
    directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(directory, name); offset += header.length + name.length + file.bytes.length;
  }
  const index = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(index.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, index, end]);
}

async function answerPdf(answer: FurlongAnswer, exportedAt: string): Promise<Buffer> {
  // The PDF is an English reference rendering; HTML/JSON preserve original Unicode.
  const plain = (value: string) => value.replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2026/g, "...");
  const doc = new PDFDocument({ size: "LETTER", margin: 48, bufferPages: true, info: {
    Title: "The Furlong Answer", Author: "Furlong", CreationDate: new Date(exportedAt), ModDate: new Date(exportedAt),
  } });
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => { doc.on("data", chunk => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  function paragraph(value: string, size = 11, bold = false) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor("#162b40");
    doc.text(plain(value), { lineGap: 4 }); doc.moveDown(0.6);
  }
  paragraph("FURLONG | CUSTOMER REFERENCE", 10, true);
  paragraph("The Furlong Answer", 25, true); paragraph(answer.title, 15, true);
  paragraph("Format: " + answer.version + " | Exported: " + exportedAt, 9);
  paragraph("Source date: " + (answer.sourceDate || "Not supplied"), 9);
  for (const section of answer.sections) {
    if (doc.y > 610) doc.addPage();
    paragraph(section.question, 14, true); paragraph(section.status, 9, true); paragraph(section.text);
  }
  if (doc.y > 570) doc.addPage();
  paragraph("Sources and limits", 14, true);
  for (const source of answer.sources) paragraph(source.label + " | " + (source.asOf || "Date not supplied") + (source.url ? "\n" + source.url : ""), 9);
  paragraph(answer.scope, 10);
  paragraph("Personal reference copy, not lender acceptance or professional certification. No documents are attached. No provider receives this download. Files do not update automatically and cannot be remotely revoked. HTML and JSON in this package preserve the original text.", 9);
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i); doc.font("Helvetica").fontSize(8).fillColor("#4c6170");
    doc.text("Furlong | " + ANSWER_EXPORT_VERSION + " | " + (i + 1) + " / " + range.count, 48, 750, { lineBreak: false });
  }
  doc.end(); return complete;
}

/** Same answer, record version and export time produce identical package bytes.
 * Hashes prove integrity, not truth or professional acceptance. Audit metadata
 * is committed by the route before any bytes are released. */
export async function buildAnswerExport(answer: FurlongAnswer, exportedAt: string, recordVersion: string) {
  if (!Number.isFinite(Date.parse(exportedAt))) throw new Error("Export date required.");
  const files: File[] = [
    { name: "Furlong-Answer.html", bytes: Buffer.from(furlongAnswerHtml(answer, exportedAt)), contentType: "text/html" },
    { name: "Furlong-Answer.json", bytes: Buffer.from(JSON.stringify({ version: ANSWER_EXPORT_VERSION, exportedAt, recordVersion, answer }, null, 2) + "\n"), contentType: "application/json" },
    { name: "Furlong-Answer.pdf", bytes: await answerPdf(answer, exportedAt), contentType: "application/pdf" },
  ];
  const manifest = { version: ANSWER_EXPORT_VERSION, caseId: answer.subjectId, recordVersion, exportedAt,
    classification: "CONFIDENTIAL", scope: "Owner-requested personal case summary; no source documents or provider delivery",
    verification: "Integrity hashes only; snapshot is not independently re-verified",
    files: files.map(file => ({ name: file.name, contentType: file.contentType, bytes: file.bytes.length, sha256: sha256(file.bytes) })),
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  return { bytes: answerZip([...files, { name: "manifest.json", bytes: manifestBytes, contentType: "application/json" }]),
    manifest, manifestHash: sha256(manifestBytes), files };
}
