import * as fs from "node:fs";
import * as path from "node:path";

import PDFDocument from "pdfkit";

import { reportTierIdentity } from "../reports/reportTierIdentity";

type PropertyEvaluationPdfInput = {
  branding: {
    logoPath: string;
    emblemPath: string;
    compassWatermarkPath: string;
    reportTitle: string;
    advisoryDisclosure: string;
    dataRightsDisclosure: string;
    footerText: string;
    generatedDate: string;
    explorationPath: string[];
  };
  tier: {
    id: string;
    label: string;
    shortLabel: string;
    description: string;
  };
  context: {
    title: string;
    location: string;
    exactAddress: string | null;
    priceLabel: string;
    propertyType: string;
    sourceLabel: string;
    currentLabel: string | null;
    importScreeningStatus?: "normal" | "reroute" | null;
    importScreeningCategory?: "standard-property" | "special-asset" | "restricted-asset" | null;
    salePosture?: "listing-source-present" | "official-disposition-source" | "unverified-public-claim" | "not-for-sale-likely" | null;
  };
  verdict: {
    label: string;
    explanation: string;
  };
  executiveSummary: string;
  propertySummary: string[];
  conceptSummary: string[];
  strengths: string[];
  risks: string[];
  pathwayAnalysis: string[];
  propertyVerificationSummary: string[];
  verifiedCriteria: string[];
  readinessSectionNotes: string[];
  keyQuestions: string[];
  nextMoves: string[];
  includedSections: string[];
  explainabilityNotes: string[];
  customerRights: string[];
  humanReviewBoundary: string[];
  /** Free Place Brief (spec 2026-07-15): sale-mechanics paragraphs. Optional for payload back-compat. */
  buyingProcess?: string[];
  /** Free Place Brief: honest unknowns ("label: how to find out"). */
  honestUnknowns?: string[];
  /** Free Place Brief: prose financing-pathways line. */
  financingProse?: string | null;
  /** Scannable place facts (label → value → short source) — replaces the wall of bullets. */
  placeFacts?: Array<{ label: string; value: string; source: string }>;
  /** Typical diligence cost guidance lines (plain-language ranges, never quotes). */
  diligenceCosts?: Array<{ label: string; range: string; note: string | null }>;
  /** Ownership-cost guidance (founder direction 2026-07-17) — present only
      when the source record publishes a price, so the signed artifact stays
      deterministic; visitor-entered price assumptions stay on-page. All
      strings pre-formatted by the workspace. */
  ownershipCosts?: {
    priceLine: string;
    scenarios: Array<{ program: string; downPayment: string; monthly: string }>;
    closingLine: string;
    monthlyLines: Array<{ label: string; range: string; note: string }>;
    totalsLines: string[];
    /** Cost horizon bands (Year 1 / 2–5 / 6–10 / 11–30), pre-formatted. */
    horizonLines: Array<{ label: string; value: string }>;
    /** Equity-outlook scenario table (never predictions), pre-formatted. */
    equityIntro?: string;
    equityRows?: Array<{ label: string; value: string }>;
    equityDisclaimers?: string[];
    disclaimers: string[];
  };
  agriculturalProForma?: {
    scopeLine: string;
    acreageRows: Array<{ label: string; value: string }>;
    operatingRows: Array<{ label: string; value: string }>;
    debtRows: Array<{ label: string; value: string }>;
    assumptions: string[];
    readiness: string[];
  };
  /** The REAL residential pro forma appendix (founder 2026-07-29): Sources &
      Uses through Cash to Close — the same modeled sections as the Pro Forma
      Report, so a first-time buyer can hand THIS document to any lender. */
  lenderProforma?: Array<{
    title: string;
    intro?: string;
    rows?: Array<{ label: string; value: string; emphasis?: boolean }>;
    paragraphs?: string[];
  }>;
  /** Lane-aware federal-program guide (founder 2026-08-05): the First-Time
      report teaches the USDA/SBA/FSA programs for THIS lane; the bold FSA
      hand-off appears when FSA programs may fit best. */
  programGuide?: {
    heading: string;
    items: Array<{ name: string; body: string }>;
    fsaNote?: string;
  };
  /** Consumer-facing transparency for brokerage agreements, commissions, concessions, and added fees. */
  compensationTransparency?: {
    posture: "CLEAR" | "REVIEW_NEEDED" | "UNKNOWN";
    knownFacts: string[];
    questionsBeforeCommitment: string[];
    reviewFlags: string[];
    legalBoundary: string[];
  };
  /** Alternatives from the tracked government inventory (honest-label rule). */
  similarHomes?: Array<{ title: string; detail: string }>;
  /** Lane burning-questions answered FOR THIS property (Tier 3, 2026-07-28):
      same content the web report shows, so the signed PDF carries the answers
      too. Title is lane-worded by the workspace; lines pre-formatted
      "Question — answer (Confirm: …)". */
  laneAnswers?: { title: string; lines: string[] } | null;
};

/**
 * Pro-forma report layout (founder direction 2026-07-17: "a really nice pro
 * forma report"). Principles that keep it from ever overlapping again:
 *
 * 1. NOTHING body-level is absolutely positioned — every block is MEASURED
 *    (heightOfString with the actual font applied) before it is drawn, and
 *    the cursor advances by real heights.
 * 2. Page breaks are explicit: a block that will not fit starts a new page;
 *    long bullet runs flow item-by-item so a single section can span pages
 *    without escaping a box that was sized by guesswork.
 * 3. Chrome (header rule, footer, page numbers) is stamped in a FINAL pass
 *    over buffered pages, so it can never collide with content.
 * 4. Watermarks live in the final pass: the official Furlong seal
 *    (public/brand/furlong-logo.png — solid white ground, so faint opacity
 *    over paper leaves only the seal) full-size behind-feeling at page
 *    center, plus the diagonal informational-purposes line. The old
 *    translucent asset that rendered a baked transparency checkerboard
 *    stays retired.
 */

const PAGE = {
  width: 612,
  height: 792,
  marginX: 48,
  contentTop: 64,
  contentBottom: 736, // footer band starts below this
};
const CONTENT_W = PAGE.width - PAGE.marginX * 2;

// Ledger palette (founder direction 2026-07-20: "not a banking algorithm — a
// timeless land ledger / ship's log"). Corporate navy/blue is gone; ink is a
// deep forest-charcoal, neutrals are warm sepia, panels sit on aged paper.
const COLORS = {
  deep: "#20302a",   // deep forest-charcoal — headers & hero ink
  text: "#33352c",   // charcoal body
  muted: "#6b6252",  // sepia-muted labels
  faint: "#9a917c",  // faint sepia (sources, fine print)
  line: "#cabfa4", // aged ruling
  paper: "#f6f1e3",  // warm paper for panels
  margin: "#4d5b3f", // dark-olive margin rule (surveyor's logbook line)
};

const FONT_CANDIDATES = {
  // Body / raw source data stays a clean, scannable sans (founder: serif for
  // headers and numbers, sans for the technical source facts).
  regular: [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
  ],
  bold: [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
  ],
  // Headers, the hero title, chapter numerals — an elegant serif for the
  // handwritten-ledger feel.
  serif: [
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Baskerville.ttc",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Palatino.ttc",
  ],
  serifBold: [
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
    "/System/Library/Fonts/Supplemental/Baskerville.ttc",
  ],
};

/**
 * Watermark seal asset PATH (not a buffer): PDFKit caches path-keyed images
 * once per document, so the seal embeds a single time no matter how many
 * pages stamp it. The dedicated -watermark.jpg is a ~90KB downscale of the
 * 6MB brand PNG — JPEG is fine because the seal sits on a solid white ground.
 */
let cachedSealPath: string | null | undefined;
function furlongSealPath(): string | null {
  if (cachedSealPath !== undefined) return cachedSealPath;
  const candidate = path.join(process.cwd(), "public/brand/furlong-logo-watermark.jpg");
  cachedSealPath = fs.existsSync(candidate) ? candidate : null; // missing asset must never block a report
  return cachedSealPath;
}

function resolveFontPath(weight: keyof typeof FONT_CANDIDATES): string | null {
  for (const candidate of FONT_CANDIDATES[weight]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const RESOLVED_FONTS = {
  regular: resolveFontPath("regular"),
  bold: resolveFontPath("bold"),
  serif: resolveFontPath("serif"),
  serifBold: resolveFontPath("serifBold"),
};

/**
 * Print-size substitutions: the brand PNGs are multi-megabyte web assets, and
 * PDFKit embeds whatever it is given — a 6MB source for a 130-pt header logo
 * made every export ~4MB. When a dedicated -print downscale exists, use it.
 */
const PRINT_ASSET_SUBSTITUTIONS: Record<string, string> = {
  "/brand/furlong-logo.png": "/brand/furlong-logo-print.jpg",
  "/brand/furlong-emblem.png": "/brand/furlong-emblem-print.png",
};

function publicAssetPath(assetPath: string): string {
  const substitute = PRINT_ASSET_SUBSTITUTIONS[assetPath];
  if (substitute) {
    const substitutePath = path.join(process.cwd(), "public", substitute.replace(/^\//, ""));
    if (fs.existsSync(substitutePath)) return substitutePath;
  }
  return path.join(process.cwd(), "public", assetPath.replace(/^\//, ""));
}

export function generatePropertyEvaluationPdf(input: PropertyEvaluationPdfInput) {
  const identity = reportTierIdentity(input.tier.id);
  const ACCENT = identity.accent;
  const ACCENT_SOFT = identity.accentSoft;

  const doc = new PDFDocument({
    size: "LETTER",
    margin: 0,
    bufferPages: true,
    // Next's runtime bundle breaks PDFKit's implicit Helvetica lookup, so we
    // start from a concrete system font or an explicit built-in.
    font: RESOLVED_FONTS.regular ?? undefined,
    info: {
      Title: `${input.branding.reportTitle} - ${input.context.title}`,
      Author: "Furlong",
      Subject: "Property evaluation advisory report",
      Creator: "Furlong",
      Producer: "Furlong PDF Renderer",
    },
  });

  const setFont = (
    weight: "regular" | "bold" | "serif" | "serifBold",
    size: number,
    color: string
  ) => {
    const resolved = RESOLVED_FONTS[weight];
    if (resolved) doc.font(resolved);
    else doc.font(weight === "bold" || weight === "serifBold" ? "Times-Bold" : "Times-Roman");
    doc.fontSize(size).fillColor(color);
  };

  const measure = (text: string, width: number, weight: "regular" | "bold" | "serif" | "serifBold", size: number, lineGap = 3): number => {
    setFont(weight, size, COLORS.text);
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

  // ── Flowing primitives (measure → draw → advance) ─────────────────────────

  const heading = (label: string) => {
    // Reserve the heading PLUS the first lines of whatever follows. At 44 a
    // heading could land alone at the foot of a page with its body pushed over
    // ("Where the file goes next" + half a blank page — founder-caught
    // 2026-07-21, the "huge empty vertical gaps"). Never orphan a heading.
    ensure(118);
    setFont("serifBold", 13, COLORS.deep);
    doc.text(label, PAGE.marginX, y, { width: CONTENT_W, characterSpacing: 0.3 });
    y = doc.y + 4;
    doc
      .save()
      .moveTo(PAGE.marginX, y)
      .lineTo(PAGE.marginX + 42, y)
      .lineWidth(identity.ruleStyle === "thick" ? 2.5 : 1.5)
      .strokeColor(ACCENT)
      .stroke()
      .restore();
    y += 12;
  };

  const paragraph = (text: string, opts: { size?: number; color?: string; width?: number; x?: number } = {}) => {
    const size = opts.size ?? 10.5;
    const width = opts.width ?? CONTENT_W;
    const x = opts.x ?? PAGE.marginX;
    const blockH = measure(text, width, "regular", size);
    // Flow long paragraphs across pages naturally: draw what fits.
    if (y + blockH > PAGE.contentBottom && blockH < PAGE.contentBottom - PAGE.contentTop) {
      if (y + 30 > PAGE.contentBottom) newPage();
    }
    setFont("regular", size, opts.color ?? COLORS.text);
    doc.text(text, x, y, { width, lineGap: 3 });
    y = doc.y + 8;
  };

  const bullets = (items: string[], opts: { width?: number; x?: number } = {}) => {
    const width = (opts.width ?? CONTENT_W) - 14;
    const x = opts.x ?? PAGE.marginX;
    for (const item of items) {
      const itemH = measure(item, width, "regular", 10.5);
      ensure(itemH + 4);
      setFont("bold", 10.5, ACCENT);
      doc.text("–", x, y);
      setFont("regular", 10.5, COLORS.text);
      doc.text(item, x + 14, y, { width, lineGap: 3 });
      y = doc.y + 6;
    }
    y += 4;
  };

  /**
   * Ledger chapter header (founder direction 2026-07-20: split the charted truth
   * into distinct "Ledger Chapters"). A serif "CHAPTER <n>" eyebrow sitting on
   * the margin rule, the chapter title, an optional subtitle, and a full rule —
   * the bound divisions of the record.
   */
  const chapter = (numeral: string, title: string, subtitle?: string, label = "CHAPTER") => {
    // A chapter opener must never end a page alone — keep it with its first
    // entries (same orphan rule as heading()).
    ensure(150);
    y += 6;
    setFont("serifBold", 8.5, ACCENT);
    doc.text(`${label} ${numeral}`, PAGE.marginX, y, { characterSpacing: 2 });
    y = doc.y + 3;
    setFont("serifBold", 16, COLORS.deep);
    doc.text(title, PAGE.marginX, y, { width: CONTENT_W });
    y = doc.y + (subtitle ? 2 : 6);
    if (subtitle) {
      setFont("serif", 9.5, COLORS.muted);
      doc.text(subtitle, PAGE.marginX, y, { width: CONTENT_W });
      y = doc.y + 6;
    }
    doc
      .save()
      .moveTo(PAGE.marginX, y)
      .lineTo(PAGE.width - PAGE.marginX, y)
      .lineWidth(1)
      .strokeColor(COLORS.margin)
      .stroke()
      .restore();
    y += 12;
  };

  /**
   * Due-diligence checklist: each item drawn with a hollow [ ] checkbox so the
   * printed page IS a workbook the reader can tick with a pen (founder
   * direction 2026-07-20). The label (before the first colon) is bold; the rest
   * flows as guidance.
   */
  const checklist = (items: string[]) => {
    const boxX = PAGE.marginX;
    const textX = PAGE.marginX + 20;
    const width = CONTENT_W - 20;
    for (const item of items) {
      const itemH = measure(item, width, "regular", 10.5);
      ensure(itemH + 8);
      const rowTop = y;
      // Hollow checkbox.
      doc
        .save()
        .roundedRect(boxX, rowTop + 1, 11, 11, 2)
        .lineWidth(1)
        .strokeColor(COLORS.margin)
        .stroke()
        .restore();
      const colon = item.indexOf(":");
      if (colon > 0 && colon < 60) {
        setFont("serifBold", 10.5, COLORS.deep);
        const lead = item.slice(0, colon + 1);
        doc.text(lead, textX, rowTop, { continued: true });
        setFont("regular", 10.5, COLORS.text);
        doc.text(` ${item.slice(colon + 1).trim()}`, { width, lineGap: 3 });
      } else {
        setFont("regular", 10.5, COLORS.text);
        doc.text(item, textX, rowTop, { width, lineGap: 3 });
      }
      y = doc.y + 9;
    }
    y += 2;
  };

  /** Pro-forma facts table: "Label" column + value column, ruled rows. */
  const factsTable = (rows: Array<{ label: string; value: string }>) => {
    const labelW = 150;
    const valueW = CONTENT_W - labelW - 16;
    for (const row of rows) {
      // Estimate for the page-break check only; the row ADVANCES from the
      // actual drawn bottoms (characterSpacing widens the label beyond any
      // plain measurement, so estimates must never drive the cursor).
      const h = Math.max(
        measure(row.label.toUpperCase(), labelW, "bold", 9.5),
        measure(row.value, valueW, "regular", 10.5)
      );
      ensure(h + 16);
      setFont("bold", 9.5, COLORS.muted);
      doc.text(row.label.toUpperCase(), PAGE.marginX, y + 2, { width: labelW, characterSpacing: 0.6, lineGap: 2 });
      const labelBottom = doc.y;
      setFont("regular", 10.5, COLORS.deep);
      doc.text(row.value, PAGE.marginX + labelW + 16, y, { width: valueW, lineGap: 2 });
      y = Math.max(labelBottom, doc.y) + 9;
      doc
        .save()
        .moveTo(PAGE.marginX, y - 4)
        .lineTo(PAGE.width - PAGE.marginX, y - 4)
        .lineWidth(0.5)
        .strokeColor(COLORS.line)
        .stroke()
        .restore();
    }
    y += 6;
  };

  /**
   * Ledger-cell grid — TWO facts per row as bounded log entries (founder
   * direction 2026-07-21). Chapter II used full-width stacked rows, so ~18
   * sourced facts sprawled across two pages like an unstyled HTML table. As a
   * 2-up matrix of ledger cells it reads like a ship's-log page and costs about
   * half the paper. Each cell: LABEL / value / source, measured before drawn.
   */
  const ledgerGrid = (cells: Array<{ label: string; value: string; source: string }>) => {
    const gap = 12;
    const colW = (CONTENT_W - gap) / 2;
    const pad = 8;
    const innerW = colW - pad * 2;
    const cellH = (c: { label: string; value: string; source: string }) =>
      measure(c.label.toUpperCase(), innerW, "bold", 8) +
      measure(c.value, innerW, "regular", 10) +
      measure(c.source, innerW, "regular", 7.5) +
      pad * 2 + 8;

    for (let i = 0; i < cells.length; i += 2) {
      const pair = cells.slice(i, i + 2);
      const rowH = Math.max(...pair.map(cellH));
      ensure(rowH + 8);
      const rowY = y;
      pair.forEach((c, col) => {
        const x = PAGE.marginX + col * (colW + gap);
        doc
          .save()
          .roundedRect(x, rowY, colW, rowH, 4)
          .lineWidth(0.6)
          .fillAndStroke(COLORS.paper, COLORS.line)
          .restore();
        let cy = rowY + pad;
        setFont("bold", 8, COLORS.muted);
        doc.text(c.label.toUpperCase(), x + pad, cy, { width: innerW, characterSpacing: 0.5 });
        cy = doc.y + 1;
        setFont("regular", 10, COLORS.deep);
        doc.text(c.value, x + pad, cy, { width: innerW, lineGap: 1 });
        cy = doc.y + 1;
        setFont("regular", 7.5, COLORS.faint);
        doc.text(c.source, x + pad, cy, { width: innerW, lineGap: 0.5 });
      });
      y = rowY + rowH + 8;
    }
    y += 2;
  };

  /** Accent-tinted panel sized by MEASURED content (never overflows). */
  const panel = (opts: { title?: string; lines: string[]; fill?: string; asBullets?: boolean }) => {
    const pad = 14;
    const innerW = CONTENT_W - pad * 2;
    let contentH = opts.title ? measure(opts.title, innerW, "bold", 9.5) + 8 : 0;
    for (const line of opts.lines) {
      contentH += measure(line, opts.asBullets ? innerW - 14 : innerW, "regular", 10.5) + 6;
    }
    const boxH = contentH + pad * 2;
    // A panel taller than a page falls back to flowing content (no box).
    if (boxH > PAGE.contentBottom - PAGE.contentTop) {
      if (opts.title) {
        setFont("bold", 9.5, COLORS.muted);
        ensure(20);
        doc.text(opts.title.toUpperCase(), PAGE.marginX, y, { characterSpacing: 0.8 });
        y = doc.y + 6;
      }
      if (opts.asBullets) bullets(opts.lines);
      else for (const line of opts.lines) paragraph(line);
      return;
    }
    ensure(boxH + 6);
    doc
      .save()
      .roundedRect(PAGE.marginX, y, CONTENT_W, boxH, 8)
      .fillAndStroke(opts.fill ?? "#ffffff", COLORS.line)
      .restore();
    let cursor = y + pad;
    if (opts.title) {
      setFont("bold", 9.5, COLORS.muted);
      doc.text(opts.title.toUpperCase(), PAGE.marginX + pad, cursor, { characterSpacing: 0.8 });
      cursor = doc.y + 8;
    }
    for (const line of opts.lines) {
      if (opts.asBullets) {
        setFont("bold", 10.5, ACCENT);
        doc.text("–", PAGE.marginX + pad, cursor);
        setFont("regular", 10.5, COLORS.text);
        doc.text(line, PAGE.marginX + pad + 14, cursor, { width: innerW - 14, lineGap: 3 });
      } else {
        setFont("regular", 10.5, COLORS.text);
        doc.text(line, PAGE.marginX + pad, cursor, { width: innerW, lineGap: 3 });
      }
      cursor = doc.y + 6;
    }
    y += boxH + 12;
  };

  /** Two measured columns, side by side; the row advances by the taller one. */
  const twoColumns = (
    left: { title: string; lines: string[] },
    right: { title: string; lines: string[] }
  ) => {
    const colW = (CONTENT_W - 20) / 2;
    const colH = (col: { title: string; lines: string[] }) => {
      let h = measure(col.title, colW, "bold", 9.5) + 8;
      for (const line of col.lines) h += measure(line, colW - 14, "regular", 10.5) + 6;
      return h;
    };
    const totalH = Math.max(colH(left), colH(right));
    // Too tall for one page → stack instead of forcing a box.
    if (totalH > PAGE.contentBottom - PAGE.contentTop - 20) {
      panel({ title: left.title, lines: left.lines, asBullets: true });
      panel({ title: right.title, lines: right.lines, asBullets: true });
      return;
    }
    ensure(totalH + 8);
    const startY = y;
    const drawCol = (col: { title: string; lines: string[] }, x: number) => {
      let cursor = startY;
      setFont("bold", 9.5, COLORS.muted);
      doc.text(col.title.toUpperCase(), x, cursor, { characterSpacing: 0.8, width: colW });
      cursor = doc.y + 8;
      for (const line of col.lines) {
        setFont("bold", 10.5, ACCENT);
        doc.text("–", x, cursor);
        setFont("regular", 10.5, COLORS.text);
        doc.text(line, x + 14, cursor, { width: colW - 14, lineGap: 3 });
        cursor = doc.y + 6;
      }
    };
    drawCol(left, PAGE.marginX);
    drawCol(right, PAGE.marginX + colW + 20);
    y = startY + totalH + 14;
  };

  // ── COVER HEADER (the only carefully hand-placed region) ──────────────────

  const logoFull = publicAssetPath(input.branding.logoPath);
  if (fs.existsSync(logoFull)) doc.image(logoFull, PAGE.marginX, 40, { fit: [130, 40] });
  const emblemFull = publicAssetPath(input.branding.emblemPath);
  if (fs.existsSync(emblemFull)) doc.image(emblemFull, PAGE.width - PAGE.marginX - 44, 36, { fit: [44, 44] });

  // Institutional land-register masthead (founder direction 2026-07-20): not
  // "COMPLIMENTARY PROPERTY PROFILE" (spammy) — THE FURLONG RECORD, with a
  // deterministic Furlong file number (our own reference, never implying a
  // government registry), the tract, and the logged date.
  const fileNo = (() => {
    let h = 0;
    const s = `${input.context.title}|${input.context.location}`;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const code = h.toString(36).toUpperCase().slice(0, 4).padStart(4, "0");
    return `FR-${input.branding.generatedDate.replace(/-/g, "")}-${code}`;
  })();
  const tractLine = input.context.exactAddress ?? input.context.title;

  y = 96;
  setFont("serifBold", 9, ACCENT);
  doc.text("THE FURLONG RECORD · LAND REGISTER", PAGE.marginX, y, { characterSpacing: 1.6 });
  y = doc.y + 9;

  setFont("serifBold", 23, COLORS.deep);
  doc.text(input.context.title, PAGE.marginX, y, { width: CONTENT_W - 130 });
  y = doc.y + 4;

  setFont("regular", 11, COLORS.text);
  doc.text(
    `${input.context.location}${input.context.exactAddress ? ` · ${input.context.exactAddress}` : ""}`,
    PAGE.marginX,
    y,
    { width: CONTENT_W - 130, lineGap: 2 }
  );
  y = doc.y + 10;

  // Tier badge, right-aligned beside the title block.
  const badgeW = 124;
  doc
    .save()
    .roundedRect(PAGE.width - PAGE.marginX - badgeW, 98, badgeW, 24, 12)
    .fill(ACCENT)
    .restore();
  setFont("serifBold", 9.5, "#ffffff");
  doc.text(input.tier.shortLabel, PAGE.width - PAGE.marginX - badgeW + 8, 105, {
    width: badgeW - 16,
    align: "center",
    height: 12,
    ellipsis: true,
  });

  // Register rule under the title block (aged ledger ruling).
  const ruleAt = (offset: number, weight: number) => {
    doc
      .save()
      .moveTo(PAGE.marginX, y + offset)
      .lineTo(PAGE.width - PAGE.marginX, y + offset)
      .lineWidth(weight)
      .strokeColor(ACCENT)
      .stroke()
      .restore();
  };
  ruleAt(0, identity.ruleStyle === "thick" ? 3 : 1.2);
  if (identity.ruleStyle === "double") ruleAt(3.5, 1.2);
  y += 12;

  // Register meta line — File No · Tract · Logged, in ledger serif.
  setFont("serif", 9.5, COLORS.muted);
  doc.text(
    `Furlong File No. ${fileNo}     ·     Tract: ${tractLine}     ·     Logged ${input.branding.generatedDate}`,
    PAGE.marginX,
    y,
    { width: CONTENT_W, lineGap: 2 }
  );
  y = doc.y + 12;

  // Source posture stays visible (honest provenance), one ledger row.
  factsTable([
    {
      label: "Entered through",
      value: `${input.context.sourceLabel}${input.context.currentLabel ? ` — ${input.context.currentLabel.toLowerCase()}` : ""}`,
    },
  ]);

  // ── VERDICT + EXECUTIVE SUMMARY ────────────────────────────────────────────

  panel({ title: "Current Posture — the open ledger", lines: [input.verdict.label, input.verdict.explanation], fill: ACCENT_SOFT });
  heading("The Navigator's Summary");
  paragraph(input.executiveSummary);

  // ── PROPERTY SNAPSHOT — a real facts table ─────────────────────────────────

  heading("Property Snapshot");
  factsTable([
    { label: "Asset", value: input.context.title },
    { label: "Location", value: `${input.context.location}${input.context.exactAddress ? ` · ${input.context.exactAddress}` : ""}` },
    { label: "Type", value: input.context.propertyType },
    { label: "Price posture", value: input.context.priceLabel },
    ...input.propertySummary
      .map((line) => {
        const idx = line.indexOf(":");
        return idx > 0 && idx < 40
          ? { label: line.slice(0, idx), value: line.slice(idx + 1).trim() }
          : { label: "Detail", value: line };
      })
      .filter((row) => !/^(asset|location|asking posture|immediate deal type|asset type|source)$/i.test(row.label)),
  ]);

  // ── LANE QUESTIONS, ANSWERED ───────────────────────────────────────────────
  // Directly after the snapshot — the founder's direct-to-answers principle
  // applies to the printed ledger too.
  if (input.laneAnswers && input.laneAnswers.lines.length > 0) {
    heading(input.laneAnswers.title);
    bullets(input.laneAnswers.lines);
  }

  // ── COST POSTURE ───────────────────────────────────────────────────────────

  heading("What This Is Likely to Cost You");
  bullets(input.conceptSummary);
  // The out-of-pocket diligence ranges no longer sit isolated here (founder
  // direction 2026-07-20: stop the flip-back-and-forth). They now travel INSIDE
  // the Uncharted Ledger chapter, as the "Provisions & Allocations" budget that
  // sits directly with the blindspots those dollars answer.

  // ── AGRICULTURAL OPERATING PRO FORMA ──────────────────────────────────────
  if (input.agriculturalProForma) {
    const farm = input.agriculturalProForma;
    heading("Agricultural Best-Use Pro Forma — Singular and Diversified Opportunity Screen");
    paragraph(farm.scopeLine);
    setFont("bold", 9.5, COLORS.muted);
    doc.text("RANKED PROPERTY-USE CANDIDATES", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    factsTable(farm.acreageRows);
    setFont("bold", 9.5, COLORS.muted);
    ensure(24);
    doc.text("DIVERSIFIED PORTFOLIO SCREEN", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    factsTable(farm.operatingRows);
    setFont("bold", 9.5, COLORS.muted);
    ensure(24);
    doc.text("DEBT SERVICE AND COVERAGE", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    factsTable(farm.debtRows);
    panel({ title: "Assumption and source status", lines: farm.assumptions, fill: ACCENT_SOFT });
    heading("FSA / Farm Credit Application Readiness");
    checklist(farm.readiness);
  }

  // ── OWNERSHIP COSTS — buy it, then keep it (founder direction 2026-07-17) ──

  if (input.ownershipCosts) {
    const own = input.ownershipCosts;
    heading("Buying It, Then Owning It — the Numbers That Decide Comfort");
    paragraph(own.priceLine);
    setFont("bold", 9.5, COLORS.muted);
    ensure(24);
    doc.text("CASH TO CLOSE AND MONTHLY PAYMENT, BY FINANCING LANE", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    factsTable(
      own.scenarios.map((s) => ({
        label: s.program,
        value: `Down: ${s.downPayment}  ·  Monthly: ${s.monthly}`,
      }))
    );
    paragraph(own.closingLine, { size: 9.5 });
    setFont("bold", 9.5, COLORS.muted);
    ensure(24);
    doc.text("THE REST OF THE MONTHLY BILL — THE PART PEOPLE UNDERESTIMATE", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    factsTable(
      own.monthlyLines.map((line) => ({
        label: line.label,
        value: `${line.range} — ${line.note}`,
      }))
    );
    panel({ lines: own.totalsLines, fill: ACCENT_SOFT });
    setFont("bold", 9.5, COLORS.muted);
    ensure(24);
    doc.text("THE COST HORIZON — FHA PATH, TODAY'S DOLLARS", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    factsTable(own.horizonLines);
    if (own.equityIntro && own.equityRows?.length) {
      heading("If You Hold It — Value and Equity Scenarios");
      paragraph(own.equityIntro, { size: 9.5 });
      factsTable(own.equityRows);
      for (const line of own.equityDisclaimers ?? []) paragraph(line, { size: 8.5, color: COLORS.muted });
    }
    for (const line of own.disclaimers) paragraph(line, { size: 8.5, color: COLORS.muted });
  }

  // ── LENDER-READY PRO FORMA (founder 2026-07-29): the same real pro forma
  // as the numbers-only edition, carried here so a first-time buyer can take
  // THIS document to any lender — ours or their own. ──
  if (input.lenderProforma?.length) {
    heading("Lender-Ready Pro Forma — Take These Numbers to Any Lender");
    for (const section of input.lenderProforma) {
      setFont("bold", 9.5, COLORS.muted);
      ensure(24);
      doc.text(section.title.toUpperCase(), PAGE.marginX, y, { characterSpacing: 0.8 });
      y = doc.y + 8;
      if (section.intro) paragraph(section.intro, { size: 9.5 });
      if (section.rows?.length) factsTable(section.rows.map((row) => ({ label: row.label, value: row.value })));
      for (const line of section.paragraphs ?? []) paragraph(line, { size: 8.5, color: COLORS.muted });
    }
  }

  if (input.programGuide) {
    heading(input.programGuide.heading);
    factsTable(input.programGuide.items.map((item) => ({ label: item.name, value: item.body })));
    if (input.programGuide.fsaNote) {
      panel({ title: "IMPORTANT \u2014 IF FSA PROGRAMS FIT THIS PROPERTY BEST", lines: [input.programGuide.fsaNote], fill: ACCENT_SOFT });
    }
  }

  if (input.compensationTransparency) {
    const comp = input.compensationTransparency;
    heading("Broker Agreements, Commissions, Concessions & Added Fees");
    panel({
      title: comp.posture === "REVIEW_NEEDED" ? "Review before signing or relying" : comp.posture === "CLEAR" ? "Disclosed cost terms" : "What is not yet known",
      lines: comp.reviewFlags.length ? comp.reviewFlags : ["No transaction-specific brokerage compensation terms have been supplied yet."],
      fill: ACCENT_SOFT,
    });
    if (comp.knownFacts.length) {
      setFont("bold", 9.5, COLORS.muted);
      ensure(24);
      doc.text("WHAT THE CURRENT RECORD SAYS", PAGE.marginX, y, { characterSpacing: 0.8 });
      y = doc.y + 8;
      bullets(comp.knownFacts);
    }
    setFont("bold", 9.5, COLORS.muted);
    ensure(24);
    doc.text("QUESTIONS TO ANSWER UP FRONT", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    checklist(comp.questionsBeforeCommitment);
    for (const line of comp.legalBoundary) paragraph(line, { size: 8.5, color: COLORS.muted });
  }

  if (input.similarHomes?.length) {
    heading("Also Tracked Nearby — Worth Comparing");
    factsTable(input.similarHomes.map((home) => ({ label: home.title, value: home.detail })));
    paragraph(
      "From the government-listing inventory Furlong tracks (HUD, USDA, Treasury, GSA) — not the whole market. A local agent will see more; these are the ones we can verify.",
      { size: 9, color: COLORS.muted }
    );
  }

  // ── SIGNALS / RISKS side by side ───────────────────────────────────────────

  heading("Your Bearings");
  twoColumns(
    {
      title: "Compass — working in your favor",
      lines: input.strengths.length > 0 ? input.strengths : ["No meaningful signals can be stated yet because the file is still too thin."],
    },
    { title: "Lighthouse — watch these first", lines: input.risks }
  );

  // ── THE CHARTED TRUTH — bound ledger chapters ─────────────────────────────
  //
  // Explicit, ordered render (founder direction 2026-07-20: distinct Ledger
  // Chapters, not one continuous vertical stream of boxes). The tier rules that
  // used to live in an array splice are preserved inline below.

  // CHAPTER I — the statutory levers (Sovereign Decrees).
  if (input.verifiedCriteria.length > 0) {
    chapter("I", "Sovereign Tax & Trade Levers", "Statutory designations attached to this tract — support, never an approval.");
    bullets(input.verifiedCriteria);
  }

  // CHAPTER II — the sourced place facts.
  if (input.placeFacts?.length) {
    chapter("II", "The Charted Place", "Sourced, dated government facts for this ground.");
    ledgerGrid(
      input.placeFacts.map((fact) => ({ label: fact.label, value: fact.value, source: fact.source }))
    );
    paragraph(
      "Every line above is a sourced, dated government fact — the full statements with verification links travel in your on-screen chart.",
      { size: 9, color: COLORS.muted }
    );
  } else if (input.propertyVerificationSummary.length > 0) {
    chapter("II", "The Charted Place", "What the record confirms for this ground.");
    bullets(input.propertyVerificationSummary);
  }

  // Financing lanes — a guide to how ground like this is paid for (not a
  // chapter of the record). Partner coordination stays informational, inside
  // the platform boundary: Furlong informs; licensed lenders decide.
  if (input.pathwayAnalysis.length > 0) {
    heading("Financing Options, Most Likely First");
    bullets(input.pathwayAnalysis);
    panel({
      title: "When you're ready to move",
      lines: [
        "Furlong coordinates financing files with Five Borough Capital, the professional financing module in the Furlong ecosystem. When you're ready, your profile and documents can carry forward — nothing re-typed, nothing resold.",
        "Worth having ready: photo ID, recent income documentation, a rough source-of-funds picture, and (once you have one) the property contract. Your readiness list tracks what's still missing.",
        "Financing decisions belong to licensed lenders — Furlong never approves, guarantees, or determines eligibility.",
      ],
      fill: ACCENT_SOFT,
    });
  }
  if (input.buyingProcess?.length) {
    heading("How This Purchase Actually Works");
    bullets(input.buyingProcess);
  }
  if (input.financingProse) {
    heading("How People Typically Pay for a Property Like This");
    bullets([input.financingProse]);
  }

  // CHAPTER III — the uncharted ledger: a due-diligence WORKBOOK with tickable
  // [ ] boxes, and the provisions budget nested right where the blindspots are
  // (founder direction 2026-07-20: no more flipping to an isolated cost table).
  if (input.honestUnknowns?.length) {
    chapter("III", "The Uncharted Ledger", "What no snapshot can confirm — tick each blindspot as you clear it.");
    checklist(input.honestUnknowns);
    if (input.diligenceCosts?.length) {
      ensure(28);
      setFont("serifBold", 9.5, COLORS.muted);
      doc.text("PROVISIONS & ALLOCATIONS — WHAT THESE ANSWERS TYPICALLY COST", PAGE.marginX, y, { characterSpacing: 0.6 });
      y = doc.y + 5;
      paragraph(
        "If you check these blindspots yourself, this is the budget to set aside for independent local professionals — guidance, never a quote.",
        { size: 9.5, color: COLORS.muted }
      );
      factsTable(
        input.diligenceCosts.map((cost) => ({ label: cost.label, value: `${cost.range}${cost.note ? ` — ${cost.note}` : ""}` }))
      );
      paragraph(
        "National ballparks — get local numbers. Outside as-is government sales, many are negotiable as seller credits.",
        { size: 8.5, color: COLORS.muted }
      );
    }
  }

  // Basis, tier extras, and priorities (tier rules preserved inline).
  if (input.explainabilityNotes.length > 0) {
    heading("Basis and Limits of This Analysis");
    bullets(input.explainabilityNotes);
  }
  if ((input.tier.id === "paid" || input.tier.id === "environmental") && input.readinessSectionNotes.length > 0) {
    heading("Optional Deeper Intake Posture");
    bullets(input.readinessSectionNotes);
  }
  // Free tier drops the "questions the platform should be asking" list (founder
  // direction 2026-07-17: the free brief just answers, it doesn't interrogate).
  if (input.tier.id !== "free" && input.keyQuestions.length > 0) {
    heading("Questions the Platform Should Already Be Asking");
    bullets(input.keyQuestions);
  }
  if (input.nextMoves.length > 0) {
    heading("Diligence Priorities Before Commitment");
    bullets(input.nextMoves);
  }

  // ── FREE-TIER TEASER (accent panel, measured) ──────────────────────────────

  if (identity.nextTierTeaser) {
    const teaser = identity.nextTierTeaser;
    // Keep this heading with its (tall) panel. heading()'s generic 118pt reserve
    // is not enough here — the panel runs several hundred points, so the heading
    // fit at the foot of a page while the box jumped to the next one, leaving an
    // orphaned title over half a blank page (founder-caught 2026-07-21). Measure
    // the panel first and demand room for BOTH, or start them together overleaf.
    const teaserLines = [teaser.intro, ...teaser.items.map((item) => `${item.name} — ${item.adds}`), teaser.closing];
    const teaserBodyH = teaserLines.reduce((sum, line) => sum + measure(line, CONTENT_W - 42, "regular", 10.5) + 6, 0);
    ensure(teaserBodyH + 96);
    heading(teaser.heading);
    panel({
      lines: [teaser.intro, ...teaser.items.map((item) => `${item.name} — ${item.adds}`), teaser.closing],
      fill: ACCENT_SOFT,
      asBullets: true,
    });
  }

  // ── SCHEDULE X — the covenant, disclosures (once), and routing ─────────────
  //
  // A single, definitive closing page (founder direction 2026-07-20): the
  // manifesto as the closing statement, the advisory/data-rights disclosures
  // stated ONCE, and the professional routing offered as tickable coordination
  // choices — never as pressure.
  newPage();
  chapter("X", "The Covenant & Next Coordinates", "Disclosures, the covenant, and where this file may go next.", "SCHEDULE");

  setFont("serifBold", 11, COLORS.deep);
  doc.text("Why we lay it all out.", PAGE.marginX, y, { continued: true });
  setFont("regular", 11, COLORS.text);
  doc.text(
    " We open every figure with its source and date because this is your ground, not ours to gate. Reading and analyzing stay anonymous — no account, no data capture, no handoff. The one exception, stated plainly: if you choose to join a waitlist or the Guild, we ask your name and email only to reach you, and tell you exactly why. That is a guarantee about our own conduct — the part we fully control. Read it, check it, and carry it wherever you like.",
    { width: CONTENT_W, lineGap: 3 }
  );
  y = doc.y + 14;

  heading("Advisory Basis and Your Rights");
  panel({
    lines: [input.branding.advisoryDisclosure, input.branding.dataRightsDisclosure, identity.footerLine],
    fill: COLORS.paper,
  });

  heading("Route This File — Your Next Coordinates");
  checklist([
    "Route this dossier to the licensed lending desk for financing coordination — USDA, SBA, or conventional mapping.",
    "Route this dossier to the Guild's licensed PE for environmental review — wetland boundary and Phase I.",
  ]);
  paragraph(
    "These route to Furlong's own disclosed people. Furlong facilitates the introduction; it never decides your deal and takes no cut of your transaction.",
    { size: 9, color: COLORS.muted }
  );

  // ── FINAL PASS: footer + page numbers on every buffered page ───────────────
  //
  // THE TIER ARTIFACT BOUNDARY (founder direction 2026-07-18, for Stuart's
  // tier verdict): the FREE export keeps the diagonal informational watermark
  // — free forever, share it anywhere, it advertises Furlong. The PAID tiers
  // export CLEAN: no diagonal line, a "prepared for institutional use" footer
  // — the take-it-to-your-lender artifact IS the paid product. The brand seal
  // and every advisory disclosure remain on all tiers.
  const cleanExport = identity.id !== "free";

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    // The full-page centre seal is GONE (founder direction 2026-07-21). Even at
    // 3% it ghosted through the body text on every page and read as a broken
    // background watermark. The seal already appears crisply in the masthead;
    // a land register does not need it bled behind its own facts. Identity now
    // rides on the margin rule + the side stamp, which never touch the text.
    // Surveyor's logbook margin rule — a dark-olive vertical line down the left
    // of every page (founder direction 2026-07-20: structural metadata to the
    // left of the line, facts to the right). The bound edge of the ledger.
    doc
      .save()
      .moveTo(PAGE.marginX - 16, PAGE.contentTop - 30)
      .lineTo(PAGE.marginX - 16, 748)
      .lineWidth(1.1)
      .strokeColor(COLORS.margin)
      .stroke()
      .restore();

    // Vertical side-stamp along the outer margin — FREE/unverified tier only.
    // Replaces the old diagonal banner that bled off the page edge. An elegant
    // alpha entry stamp, not a broken diagnostic watermark.
    if (!cleanExport) {
      doc.save();
      // Sits at x≈PAGE.width-20, a clear 20pt outside the text column (which
      // ends at marginX + CONTENT_W), so it can never touch a line of copy.
      doc.rotate(-90, { origin: [PAGE.width - 20, PAGE.height / 2] });
      setFont("regular", 7, COLORS.faint);
      doc.fillOpacity(0.4);
      doc.text(
        `α // FURLONG UNVERIFIED ENTRY · ${input.branding.generatedDate}`,
        PAGE.width - 20 - 130,
        PAGE.height / 2 - 5,
        { width: 260, align: "center", characterSpacing: 1, lineBreak: false }
      );
      doc.fillOpacity(1);
      doc.restore();
    }
    doc
      .save()
      .moveTo(PAGE.marginX, 752)
      .lineTo(PAGE.width - PAGE.marginX, 752)
      .lineWidth(0.5)
      .strokeColor(COLORS.line)
      .stroke()
      .restore();
    setFont("regular", 8, COLORS.faint);
    doc.text(input.branding.footerText, PAGE.marginX, 760, {
      width: CONTENT_W - 150,
      height: 20,
      ellipsis: true,
      lineBreak: false,
    });
    setFont("bold", 8, COLORS.muted);
    doc.text(
      `${cleanExport ? "FURLONG institutional export" : "Watermarked FURLONG export"} · Page ${i - range.start + 1} of ${range.count}`,
      PAGE.marginX + CONTENT_W - 220,
      760,
      {
        width: 220,
        align: "right",
        lineBreak: false,
      }
    );
  }

  doc.end();
  return doc;
}
