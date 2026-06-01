import PDFDocument from "pdfkit";

/**
 * Governed PDF Renderer
 *
 * Master Volume Governance:
 * - Vol I: rendered report content must stay within constitutional authority.
 * - Vol II: PDF output must preserve advisory-only and non-reliance language.
 * - Vol III: report rendering must be deterministic for replay review.
 * - Vol IV: generated artifacts must support operator review and retention.
 * - Vol V: report export remains controlled, classified, explainable, and
 *   unsuitable for official regulated reliance without human review.
 */

type ReportPrimitive = string | number | boolean | null | undefined;

type ReportSectionValue =
  | ReportPrimitive
  | ReportSectionValue[]
  | ReportSectionObject;

type ReportSectionObject = {
  [key: string]: ReportSectionValue;
};

type PdfReport = {
  title?: string | null;
  advisory?: string | null;
  sections?: ReportSectionObject;
};

function formatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderValue(doc: any, value: ReportSectionValue, depth = 0): void {
  const prefix = depth > 0 ? "  ".repeat(depth) : "";

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "object" && item !== null) {
        renderValue(doc, item, depth + 1);
      } else {
        doc.text(`${prefix}- ${String(item ?? "")}`);
      }
    }

    return;
  }

  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      doc.text(`${prefix}${formatLabel(key)}:`);
      renderValue(doc, nestedValue, depth + 1);
    }

    return;
  }

  doc.text(`${prefix}${String(value ?? "")}`);
}

export function generateReportPdf(report: PdfReport) {
  const doc = new PDFDocument();
  const title = report.title ?? "Baseline Readiness Report";

  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown();

  if (report.advisory) {
    doc.fontSize(10).text(report.advisory);
    doc.moveDown();
  }

  for (const [sectionName, sectionValue] of Object.entries(
    report.sections ?? {}
  )) {
    doc.fontSize(12).text(formatLabel(sectionName));
    renderValue(doc, sectionValue);
    doc.moveDown();
  }

  doc.fontSize(10).text(
    "AI-GENERATED INFORMATION ONLY - NOT AN OFFICIAL REPORT - NOT VALID FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE."
  );

  doc.end();

  return doc;
}
