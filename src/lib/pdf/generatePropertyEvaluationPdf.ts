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
  /** Alternatives from the tracked government inventory (honest-label rule). */
  similarHomes?: Array<{ title: string; detail: string }>;
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

  // ONE header phrase (founder: the badge/title pair was redundant); the
  // PROPERTY is the hero line.
  y = 96;
  setFont("bold", 8.5, ACCENT);
  doc.text(identity.coverBadge, PAGE.marginX, y, { characterSpacing: 2.2 });
  y = doc.y + 8;

  setFont("bold", 22, identity.ink);
  doc.text(input.context.title, PAGE.marginX, y, { width: CONTENT_W - 140 });
  y = doc.y + 4;

  setFont("regular", 11, COLORS.text);
  doc.text(
    `${input.context.location}${input.context.exactAddress ? ` · ${input.context.exactAddress}` : ""}`,
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
    { label: "Prepared", value: input.branding.generatedDate },
    {
      label: "Listed through",
      value: `${input.context.sourceLabel}${input.context.currentLabel ? ` — ${input.context.currentLabel.toLowerCase()}` : ""}`,
    },
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

  heading("What This Is Likely to Cost You");
  bullets(input.conceptSummary);
  if (input.diligenceCosts?.length) {
    setFont("bold", 9.5, COLORS.muted);
    ensure(24);
    doc.text("TYPICAL OUT-OF-POCKET RANGES — GUIDANCE, NOT QUOTES", PAGE.marginX, y, { characterSpacing: 0.8 });
    y = doc.y + 8;
    factsTable(
      input.diligenceCosts.map((cost) => ({
        label: cost.label,
        value: `${cost.range}${cost.note ? ` — ${cost.note}` : ""}`,
      }))
    );
    paragraph(
      "National ballparks so you can budget — get local numbers. Outside as-is government sales, many of these are negotiable as seller credits.",
      { size: 9, color: COLORS.muted }
    );
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
    { title: "Financing Options, Most Likely First", items: input.pathwayAnalysis },
    // The verified-facts WALL is replaced by the scannable table below when
    // structured facts are present; the bullets remain only as a fallback
    // for older payloads.
    ...(input.placeFacts?.length
      ? []
      : [{ title: "Property Verification Summary", items: input.propertyVerificationSummary }]),
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
    // Founder direction 2026-07-17: every applicable lane prints, ordered by
    // likelihood (the ranking engine's order) — never a guarantee.
    const controllingQuestionIndex = sections.findIndex((section) => section.title === "Questions the Platform Should Already Be Asking");
    if (controllingQuestionIndex >= 0) sections.splice(controllingQuestionIndex, 1);
  }

  let factsRendered = false;
  for (const section of sections) {
    if (section.items.length === 0) continue;
    heading(section.title);
    bullets(section.items);
    if (section.title === "Financing Options, Most Likely First") {
      // Partner coordination — informational, inside the platform's
      // boundary rule: "Furlong informs. Compass/Five Borough performs
      // professional financing work when separately activated." No external
      // URL (domain activation stays governance-gated), no approval claims.
      panel({
        title: "When you're ready to move",
        lines: [
          "Furlong coordinates financing files with Five Borough Capital, the professional financing module in the Furlong ecosystem. When you're ready, your profile and documents can carry forward — nothing re-typed, nothing resold.",
          "Worth having ready: photo ID, recent income documentation, a rough source-of-funds picture, and (once you have one) the property contract. Your readiness list above tracks what's still missing.",
          "Financing decisions belong to licensed lenders — Furlong never approves, guarantees, or determines eligibility.",
        ],
        fill: ACCENT_SOFT,
      });
    }
    if (!factsRendered && input.placeFacts?.length && section.title === "Financing Options, Most Likely First") {
      factsRendered = true;
      heading("The Place, Verified — At a Glance");
      factsTable(
        input.placeFacts.map((fact) => ({
          label: fact.label,
          value: `${fact.value}  ·  ${fact.source}`,
        }))
      );
      paragraph(
        "Every line above is a sourced, dated government fact — the full statements with verification links travel in your on-screen chart.",
        { size: 9, color: COLORS.muted }
      );
    }
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
    // Full-size Furlong seal at page center, print-safe opacity (founder
    // direction 2026-07-17: the actual logo as watermark on every page).
    const seal = furlongSealPath();
    if (seal) {
      const sealW = 430;
      const sealH = sealW * (687 / 800); // asset aspect ratio
      doc.save();
      doc.opacity(0.05);
      doc.image(seal, (PAGE.width - sealW) / 2, (PAGE.height - sealH) / 2, { width: sealW });
      doc.opacity(1);
      doc.restore();
    }
    // Diagonal watermark on every printed page (founder direction).
    doc.save();
    doc.rotate(-32, { origin: [PAGE.width / 2, PAGE.height / 2] });
    setFont("bold", 30, COLORS.deep);
    doc.fillOpacity(0.045);
    doc.text("FURLONG — FOR INFORMATIONAL PURPOSES · NOT FOR REPRODUCTION", 30, PAGE.height / 2 - 14, {
      width: PAGE.width + 120,
      align: "center",
      lineBreak: false,
    });
    doc.fillOpacity(1);
    doc.restore();
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
