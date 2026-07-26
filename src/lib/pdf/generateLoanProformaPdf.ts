import * as fs from "node:fs";
import * as path from "node:path";

import PDFDocument from "pdfkit";

/**
 * Furlong Loan Proforma & Business Plan — the "ultimate pro forma".
 *
 * FORMAT AUTHORITY (founder direction 2026-07-26): this generator reproduces,
 * section for section and table for table, the founder's own banker-accepted
 * SBA loan package (Ares_Farm_SBA_Loan_Package_SIGNED.pdf) — with FURLONG's
 * logo in place of the Ares Farms logo. Cover manifest → intro narrative →
 * SECTION 1..N ruled navy tables → personal financial statement with a
 * signature block → CONFIDENTIAL footer with the small logo on every page.
 *
 * DATA DISCIPLINE (non-negotiable):
 *  - This module renders whatever LoanProformaInput the caller assembles from a
 *    borrower's OWN file. No real borrower's figures, names, EINs, or
 *    signatures are ever baked into code or fixtures — test data must be
 *    plainly synthetic.
 *  - The signature line renders EMPTY for the borrower to sign. Never
 *    reproduce a signature image.
 *  - Advisory boundary: the document presents the borrower's own documented
 *    numbers to their lender. Furlong computes and formats; licensed lenders
 *    decide. Nothing here is an approval or eligibility determination.
 *
 * Layout engine: same measured-flow discipline as the Land Register generator
 * (measure → draw → advance; explicit page breaks; chrome stamped in a final
 * pass) so blocks can never overlap and headings are never orphaned.
 */

export type ProformaTableAlign = "left" | "right";

export interface ProformaColumn {
  header: string;
  /** Fraction of the content width (columns should sum to ~1). */
  width: number;
  align?: ProformaTableAlign;
}

export interface ProformaRow {
  cells: string[];
  /** Bold + light-gray fill — the TOTAL/Subtotal treatment. */
  emphasis?: boolean;
}

export interface ProformaTable {
  columns: ProformaColumn[];
  rows: ProformaRow[];
}

export interface ProformaSection {
  /** e.g. "SECTION 1 — TRANSACTION BREAKDOWN" (rendered verbatim). */
  title: string;
  /** Optional bold lead-in line (e.g. the per-property revenue intro). */
  leadIns?: Array<{ text: string; bold?: boolean }>;
  tables?: Array<{ intro?: string; introBold?: boolean; table: ProformaTable }>;
  /** Prose paragraphs after the tables (narratives under S2/S3, S9 body). */
  paragraphs?: string[];
}

export interface LoanProformaInput {
  branding: {
    /** Public asset path, e.g. "/brand/furlong-logo.png". */
    logoPath: string;
    /** Footer identity, e.g. "Meadowline Farm, Inc. — SBA Loan Proforma". */
    footerIdentity: string;
  };
  cover: {
    docTitle: string; // "SBA LOAN PROFORMA & BUSINESS PLAN"
    subtitle: string; // "Recommended Three-Farm Acquisition"
    propertyLine: string; // "Wellington Farm, PA + ..."
    preparedFor: Array<{ name: string; detail?: string }>;
    borrowerLine: string; // entity names
    principalLine: string; // principal's name/credentials
    dateLine: string; // "June 2026"
    confidential: boolean;
  };
  /** The executive narrative paragraph(s) that open page 2. */
  introParagraphs: string[];
  sections: ProformaSection[];
  signatureBlock?: {
    certification: string;
    signerName: string;
    /** Fine-print line under the signature area. */
    finePrint?: string;
  };
}

const PAGE = { width: 612, height: 792, marginX: 66, contentTop: 58, contentBottom: 726 };
const CONTENT_W = PAGE.width - PAGE.marginX * 2;

// The package's palette: institutional navy bars, charcoal body, hairline rules.
const NAVY = "#1f3864";
const BODY = "#222222";
const MUTED = "#666666";
const RULE = "#c8c8c8";
const FILL_EMPH = "#e8e8e8";
const HEADER_TEXT = "#ffffff";

const FONTS = {
  regular: [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
  ],
  bold: [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
  ],
};

function resolveFont(candidates: string[]): string | null {
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}
const FONT = { regular: resolveFont(FONTS.regular), bold: resolveFont(FONTS.bold) };

const PRINT_SUBSTITUTIONS: Record<string, string> = {
  "/brand/furlong-logo.png": "/brand/furlong-logo-print.jpg",
};
function assetPath(p: string): string {
  const sub = PRINT_SUBSTITUTIONS[p];
  if (sub) {
    const full = path.join(process.cwd(), "public", sub.replace(/^\//, ""));
    if (fs.existsSync(full)) return full;
  }
  return path.join(process.cwd(), "public", p.replace(/^\//, ""));
}

export function generateLoanProformaPdf(input: LoanProformaInput) {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 0,
    bufferPages: true,
    font: FONT.regular ?? undefined,
    info: {
      Title: `${input.cover.docTitle} — ${input.cover.borrowerLine}`,
      Author: "Furlong",
      Subject: "Loan proforma and business plan (borrower-directed)",
      Creator: "Furlong",
      Producer: "Furlong PDF Renderer",
    },
  });

  const setFont = (weight: "regular" | "bold", size: number, color: string) => {
    const resolved = FONT[weight];
    if (resolved) doc.font(resolved);
    else doc.font(weight === "bold" ? "Helvetica-Bold" : "Helvetica");
    doc.fontSize(size).fillColor(color);
  };
  const measure = (text: string, width: number, weight: "regular" | "bold", size: number, lineGap = 2): number => {
    setFont(weight, size, BODY);
    return doc.heightOfString(text, { width, lineGap });
  };

  let y = PAGE.contentTop;
  const newPage = () => {
    doc.addPage();
    y = PAGE.contentTop;
  };
  const ensure = (needed: number) => {
    if (y + needed > PAGE.contentBottom) newPage();
  };

  const paragraph = (text: string, opts: { size?: number; bold?: boolean; color?: string; gapAfter?: number } = {}) => {
    const size = opts.size ?? 9.5;
    const h = measure(text, CONTENT_W, opts.bold ? "bold" : "regular", size);
    if (y + Math.min(h, 60) > PAGE.contentBottom) newPage();
    setFont(opts.bold ? "bold" : "regular", size, opts.color ?? BODY);
    doc.text(text, PAGE.marginX, y, { width: CONTENT_W, lineGap: 2 });
    y = doc.y + (opts.gapAfter ?? 8);
  };

  /** "SECTION N — TITLE" — bold navy, kept with its first content block. */
  const sectionTitle = (title: string) => {
    ensure(120);
    y += 4;
    setFont("bold", 12.5, NAVY);
    doc.text(title, PAGE.marginX, y, { width: CONTENT_W, characterSpacing: 0.2 });
    y = doc.y + 7;
  };

  /**
   * The package's signature table: full-width navy header bar with white bold
   * column heads; 9pt body rows separated by hairline rules; numeric columns
   * right-aligned; emphasis rows bold on light gray. Header re-stamps after a
   * page break so a split table stays readable.
   */
  const table = (t: ProformaTable) => {
    const pad = 6;
    const widths = t.columns.map((c) => Math.floor(c.width * CONTENT_W));
    const colX: number[] = [];
    let acc = PAGE.marginX;
    for (const w of widths) {
      colX.push(acc);
      acc += w;
    }

    const headerH =
      Math.max(...t.columns.map((c, i) => measure(c.header, widths[i] - pad * 2, "bold", 8.5))) + pad * 2 - 2;

    const drawHeader = () => {
      ensure(headerH + 26);
      doc.save().rect(PAGE.marginX, y, CONTENT_W, headerH).fill(NAVY).restore();
      t.columns.forEach((c, i) => {
        setFont("bold", 8.5, HEADER_TEXT);
        doc.text(c.header, colX[i] + pad, y + pad - 1, {
          width: widths[i] - pad * 2,
          align: c.align ?? (i === 0 ? "left" : "right"),
          lineGap: 1,
        });
      });
      y += headerH;
    };

    drawHeader();
    for (const row of t.rows) {
      const weight = row.emphasis ? "bold" : "regular";
      const rowH =
        Math.max(
          ...row.cells.map((cell, i) => measure(cell, widths[i] - pad * 2, weight, 9))
        ) + pad * 2 - 3;
      if (y + rowH > PAGE.contentBottom) {
        newPage();
        drawHeader();
      }
      if (row.emphasis) {
        doc.save().rect(PAGE.marginX, y, CONTENT_W, rowH).fill(FILL_EMPH).restore();
      }
      row.cells.forEach((cell, i) => {
        setFont(weight, 9, BODY);
        doc.text(cell, colX[i] + pad, y + pad - 2, {
          width: widths[i] - pad * 2,
          align: t.columns[i].align ?? (i === 0 ? "left" : "right"),
          lineGap: 1,
        });
      });
      y += rowH;
      doc
        .save()
        .moveTo(PAGE.marginX, y)
        .lineTo(PAGE.marginX + CONTENT_W, y)
        .lineWidth(0.5)
        .strokeColor(RULE)
        .stroke()
        .restore();
    }
    y += 10;
  };

  // ── COVER ──────────────────────────────────────────────────────────────────
  const logo = assetPath(input.branding.logoPath);
  if (fs.existsSync(logo)) {
    // Large centered mark, upper third — the package leads with the brand.
    doc.image(logo, PAGE.width / 2 - 105, 128, { fit: [210, 210], align: "center" });
  }
  y = 372;
  setFont("bold", 18.5, NAVY);
  doc.text(input.cover.docTitle, PAGE.marginX, y, { width: CONTENT_W, align: "center" });
  y = doc.y + 4;
  setFont("bold", 12.5, "#3b475a");
  doc.text(input.cover.subtitle, PAGE.marginX, y, { width: CONTENT_W, align: "center" });
  y = doc.y + 4;
  setFont("regular", 10.5, BODY);
  doc.text(input.cover.propertyLine, PAGE.marginX, y, { width: CONTENT_W, align: "center" });
  y = doc.y + 18;
  doc
    .save()
    .moveTo(PAGE.marginX, y)
    .lineTo(PAGE.width - PAGE.marginX, y)
    .lineWidth(1)
    .strokeColor(NAVY)
    .stroke()
    .restore();
  y += 20;

  setFont("regular", 8, MUTED);
  doc.text("PREPARED FOR", PAGE.marginX, y, { width: CONTENT_W, align: "center", characterSpacing: 1.2 });
  y = doc.y + 5;
  for (const pf of input.cover.preparedFor) {
    setFont("bold", 11, BODY);
    doc.text(pf.name, PAGE.marginX, y, { width: CONTENT_W, align: "center" });
    y = doc.y + 1;
    if (pf.detail) {
      setFont("regular", 8.5, MUTED);
      doc.text(pf.detail, PAGE.marginX, y, { width: CONTENT_W, align: "center" });
      y = doc.y + 4;
    } else {
      y += 4;
    }
  }
  y += 8;
  setFont("regular", 8, MUTED);
  doc.text("BORROWER", PAGE.marginX, y, { width: CONTENT_W, align: "center", characterSpacing: 1.2 });
  y = doc.y + 5;
  setFont("bold", 11, BODY);
  doc.text(input.cover.borrowerLine, PAGE.marginX, y, { width: CONTENT_W, align: "center" });
  y = doc.y + 2;
  setFont("regular", 9.5, BODY);
  doc.text(input.cover.principalLine, PAGE.marginX, y, { width: CONTENT_W, align: "center" });
  y = doc.y + 16;
  setFont("bold", 10, "#3b475a");
  doc.text(
    `${input.cover.dateLine}${input.cover.confidential ? "     ·     CONFIDENTIAL" : ""}`,
    PAGE.marginX,
    y,
    { width: CONTENT_W, align: "center" }
  );

  // ── BODY ───────────────────────────────────────────────────────────────────
  newPage();
  for (const para of input.introParagraphs) paragraph(para, { size: 9.5 });

  for (const section of input.sections) {
    sectionTitle(section.title);
    for (const lead of section.leadIns ?? []) paragraph(lead.text, { size: 9.5, bold: lead.bold, gapAfter: 5 });
    for (const block of section.tables ?? []) {
      if (block.intro) paragraph(block.intro, { size: 9.5, bold: block.introBold, gapAfter: 5 });
      table(block.table);
    }
    for (const para of section.paragraphs ?? []) paragraph(para, { size: 9.5 });
  }

  // ── SIGNATURE BLOCK (renders EMPTY — the borrower signs their own package) ─
  if (input.signatureBlock) {
    const sig = input.signatureBlock;
    ensure(150);
    paragraph(sig.certification, { size: 9.5 });
    y += 14;
    ensure(60);
    // Measured signature row: label → rule → label → rule, all on one baseline
    // (space-padding drifted the Date rule off its label — founder-caught).
    setFont("regular", 10, BODY);
    const baseline = y;
    const sigLabel = "Signature: ";
    const dateLabel = "Date: ";
    const sigLabelW = doc.widthOfString(sigLabel);
    doc.text(sigLabel, PAGE.marginX, baseline, { lineBreak: false });
    const sigLineStart = PAGE.marginX + sigLabelW + 2;
    const sigLineEnd = sigLineStart + 238;
    const dateLabelX = sigLineEnd + 18;
    doc.text(dateLabel, dateLabelX, baseline, { lineBreak: false });
    const dateLineStart = dateLabelX + doc.widthOfString(dateLabel) + 2;
    const dateLineEnd = Math.min(dateLineStart + 110, PAGE.marginX + CONTENT_W);
    const ruleY = baseline + 11;
    doc
      .save()
      .moveTo(sigLineStart, ruleY)
      .lineTo(sigLineEnd, ruleY)
      .lineWidth(0.7)
      .strokeColor(BODY)
      .stroke()
      .moveTo(dateLineStart, ruleY)
      .lineTo(dateLineEnd, ruleY)
      .lineWidth(0.7)
      .strokeColor(BODY)
      .stroke()
      .restore();
    y = ruleY + 6;
    setFont("bold", 10, BODY);
    doc.text(sig.signerName, PAGE.marginX, y, { width: CONTENT_W });
    y = doc.y + 10;
    if (sig.finePrint) {
      setFont("regular", 7.5, MUTED);
      doc.text(sig.finePrint, PAGE.marginX, y, { width: CONTENT_W, lineGap: 1.5, oblique: true });
      y = doc.y;
    }
  }

  // ── FINAL PASS: small centered logo + CONFIDENTIAL footer on every page ────
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    if (fs.existsSync(logo)) {
      doc.image(logo, PAGE.width / 2 - 16, 736, { fit: [32, 32] });
    }
    setFont("regular", 7.5, MUTED);
    doc.text(
      `${input.branding.footerIdentity}   |   ${input.cover.confidential ? "CONFIDENTIAL   |   " : ""}Page ${i - range.start + 1}`,
      PAGE.marginX,
      772,
      { width: CONTENT_W, align: "center", lineBreak: false }
    );
  }

  doc.end();
  return doc;
}
