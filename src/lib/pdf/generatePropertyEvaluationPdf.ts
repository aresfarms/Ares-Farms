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
 * 4. The translucent compass watermark asset is gone (it rendered its baked
 *    transparency checkerboard); branding is the logo + emblem, small and
 *    opaque, plus the tier's accent language.
 */

const PAGE = {
  width: 612,
  height: 792,
  marginX: 48,
  contentTop: 64,
  contentBottom: 736, // footer band starts below this
};
const CONTENT_W = PAGE.width - PAGE.marginX * 2;

const COLORS = {
  deep: "#162033",
  text: "#3b475a",
  muted: "#66758a",
  faint: "#9aa6b6",
  line: "#d7deea",
  paper: "#f7f9fb",
};

const FONT_CANDIDATES = {
  regular: [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
  ],
  bold: [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
  ],
};

function resolveFontPath(weight: keyof typeof FONT_CANDIDATES): string | null {
  for (const candidate of FONT_CANDIDATES[weight]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const RESOLVED_FONTS = {
  regular: resolveFontPath("regular"),
  bold: resolveFontPath("bold"),
};

function publicAssetPath(assetPath: string): string {
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

  const setFont = (weight: "regular" | "bold", size: number, color: string) => {
    const resolved = RESOLVED_FONTS[weight];
    if (resolved) doc.font(resolved);
    else doc.font(weight === "bold" ? "Times-Bold" : "Times-Roman");
    doc.fontSize(size).fillColor(color);
  };

  const measure = (text: string, width: number, weight: "regular" | "bold", size: number, lineGap = 3): number => {
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
    ensure(44);
    setFont("bold", 10.5, ACCENT);
    doc.text(label.toUpperCase(), PAGE.marginX, y, { width: CONTENT_W, characterSpacing: 1.4 });
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

  y = 96;
  setFont("bold", 8.5, ACCENT);
  doc.text(identity.coverBadge, PAGE.marginX, y, { characterSpacing: 2.2 });
  y = doc.y + 6;

  setFont("bold", 22, identity.ink);
  doc.text(identity.displayName, PAGE.marginX, y, { width: CONTENT_W - 140 });
  y = doc.y + 4;

  setFont("regular", 11, COLORS.text);
  doc.text(
    `${input.context.title} — ${input.context.location}${input.context.exactAddress ? ` · ${input.context.exactAddress}` : ""}`,
    PAGE.marginX,
    y,
    { width: CONTENT_W - 140, lineGap: 2 }
  );
  y = doc.y + 10;

  // Tier badge, right-aligned beside the title block.
  const badgeW = 124;
  doc
    .save()
    .roundedRect(PAGE.width - PAGE.marginX - badgeW, 98, badgeW, 24, 12)
    .fill(ACCENT)
    .restore();
  setFont("bold", 9.5, "#ffffff");
  doc.text(input.tier.shortLabel, PAGE.width - PAGE.marginX - badgeW + 8, 105, {
    width: badgeW - 16,
    align: "center",
    height: 12,
    ellipsis: true,
  });

  // Tier rule (single / double / thick) under the title block.
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
  y += 14;

  // Document meta row — pro-forma style.
  factsTable([
    { label: "Generated", value: input.branding.generatedDate },
    { label: "Path", value: ["Furlong", ...input.branding.explorationPath].join(" → ") },
    { label: "Source posture", value: input.context.currentLabel ?? input.context.sourceLabel },
    { label: "Tier purpose", value: input.tier.description },
  ]);

  // ── VERDICT + EXECUTIVE SUMMARY ────────────────────────────────────────────

  panel({ title: "Verdict", lines: [input.verdict.label, input.verdict.explanation], fill: ACCENT_SOFT });
  heading("Executive Summary");
  paragraph(input.executiveSummary);

  // ── PROPERTY SNAPSHOT — a real facts table ─────────────────────────────────

  heading("Property Snapshot");
  factsTable([
    { label: "Asset", value: input.context.title },
    { label: "Location", value: `${input.context.location}${input.context.exactAddress ? ` · ${input.context.exactAddress}` : ""}` },
    { label: "Type", value: input.context.propertyType },
    { label: "Source", value: input.context.sourceLabel },
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

  // ── COST POSTURE ───────────────────────────────────────────────────────────

  heading("Expected Cost Posture and Capital Frame");
  bullets(input.conceptSummary);

  // ── SIGNALS / RISKS side by side ───────────────────────────────────────────

  heading("Signals and Constraints");
  twoColumns(
    {
      title: "Strongest signals",
      lines: input.strengths.length > 0 ? input.strengths : ["No meaningful signals can be stated yet because the file is still too thin."],
    },
    { title: "Risks and blockers", lines: input.risks }
  );

  // ── FLOWING SECTIONS ───────────────────────────────────────────────────────

  const placeBriefSections: Array<{ title: string; items: string[] }> = [
    ...(input.buyingProcess?.length
      ? [{ title: "How This Purchase Actually Works", items: input.buyingProcess }]
      : []),
    ...(input.financingProse
      ? [{ title: "How People Typically Pay for a Property Like This", items: [input.financingProse] }]
      : []),
    ...(input.honestUnknowns?.length
      ? [{ title: "Honest Unknowns — and How You'd Find Out", items: input.honestUnknowns }]
      : []),
  ];

  const sections: Array<{ title: string; items: string[] }> = [
    { title: "Ranked Financing Lanes", items: input.pathwayAnalysis },
    { title: "Property Verification Summary", items: input.propertyVerificationSummary },
    { title: "Property-Side Criteria and External Flags", items: input.verifiedCriteria },
    ...placeBriefSections,
    { title: "Basis and Limits of This Analysis", items: input.explainabilityNotes },
    { title: "Questions the Platform Should Already Be Asking", items: input.keyQuestions },
    { title: "Diligence Priorities Before Commitment", items: input.nextMoves },
  ];

  if (input.tier.id === "paid" || input.tier.id === "environmental") {
    const basisIndex = sections.findIndex((section) => section.title === "Basis and Limits of This Analysis");
    sections.splice(basisIndex >= 0 ? basisIndex : 3, 0, { title: "Optional Deeper Intake Posture", items: input.readinessSectionNotes });
  }

  if (input.tier.id === "free") {
    sections[0] = { title: "Ranked Financing Lanes", items: input.pathwayAnalysis.slice(0, 1) };
    const controllingQuestionIndex = sections.findIndex((section) => section.title === "Questions the Platform Should Already Be Asking");
    if (controllingQuestionIndex >= 0) sections.splice(controllingQuestionIndex, 1);
  }

  for (const section of sections) {
    if (section.items.length === 0) continue;
    heading(section.title);
    bullets(section.items);
  }

  // ── FREE-TIER TEASER (accent panel, measured) ──────────────────────────────

  if (identity.nextTierTeaser) {
    const teaser = identity.nextTierTeaser;
    heading(teaser.heading);
    panel({
      lines: [teaser.intro, ...teaser.items.map((item) => `${item.name} — ${item.adds}`), teaser.closing],
      fill: ACCENT_SOFT,
      asBullets: true,
    });
  }

  // ── BASIS & DISCLOSURES (flow — never pinned to a fixed offset) ────────────

  ensure(170); // keep the heading with its panel — no orphaned headings
  heading("Advisory Basis and Your Rights");
  panel({
    lines: [input.branding.advisoryDisclosure, input.branding.dataRightsDisclosure, identity.footerLine],
    fill: COLORS.paper,
  });

  // ── FINAL PASS: footer + page numbers on every buffered page ───────────────

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
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
    doc.text(`Watermarked FURLONG export · Page ${i - range.start + 1} of ${range.count}`, PAGE.marginX + CONTENT_W - 220, 760, {
      width: 220,
      align: "right",
      lineBreak: false,
    });
  }

  doc.end();
  return doc;
}
