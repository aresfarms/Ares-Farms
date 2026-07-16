import * as fs from "node:fs";
import * as path from "node:path";

import PDFDocument from "pdfkit";

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
};

const PAGE = {
  width: 612,
  height: 792,
  marginX: 44,
  marginTop: 42,
  marginBottom: 40,
};

const COLORS = {
  navy: "#12344d",
  deep: "#162033",
  teal: "#0f766e",
  gold: "#9c6b1b",
  softBlue: "#eef4fb",
  line: "#d7deea",
  text: "#3b475a",
  muted: "#66758a",
  paper: "#fbfcfe",
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

function applyFont(doc: any, weight: keyof typeof RESOLVED_FONTS) {
  const resolved = RESOLVED_FONTS[weight];
  if (resolved) {
    doc.font(resolved);
    return;
  }
  doc.font(weight === "bold" ? "Times-Bold" : "Times-Roman");
}

function publicAssetPath(assetPath: string): string {
  return path.join(process.cwd(), "public", assetPath.replace(/^\//, ""));
}

function imageIfExists(doc: any, assetPath: string, x: number, y: number, opts: Record<string, unknown> = {}) {
  const full = publicAssetPath(assetPath);
  if (fs.existsSync(full)) {
    doc.image(full, x, y, opts);
  }
}

function sectionTitle(doc: any, label: string, y: number) {
  applyFont(doc, "bold");
  doc
    .fillColor(COLORS.teal)
    .fontSize(11)
    .text(label.toUpperCase(), PAGE.marginX, y, { width: PAGE.width - PAGE.marginX * 2, characterSpacing: 1.1 });
}

function bodyText(doc: any, text: string, x: number, y: number, width: number, opts?: Record<string, unknown>) {
  applyFont(doc, "regular");
  doc
    .fillColor(COLORS.text)
    .fontSize(10.5)
    .text(text, x, y, { width, lineGap: 3, ...opts });
}

function bulletList(doc: any, items: string[], x: number, y: number, width: number) {
  let cursor = y;
  for (const item of items) {
    applyFont(doc, "bold");
    doc
      .fillColor(COLORS.gold)
      .fontSize(11)
      .text("•", x, cursor);
    applyFont(doc, "regular");
    doc
      .fillColor(COLORS.text)
      .fontSize(10.5)
      .text(item, x + 12, cursor - 1, { width: width - 12, lineGap: 3 });
    cursor = doc.y + 6;
  }
  return cursor;
}

function card(doc: any, x: number, y: number, w: number, h: number, fill = "#ffffff") {
  doc
    .save()
    .roundedRect(x, y, w, h, 12)
    .fillAndStroke(fill, COLORS.line)
    .restore();
}

function ensureSpace(doc: any, neededHeight: number) {
  if (doc.y + neededHeight <= PAGE.height - PAGE.marginBottom) return;
  doc.addPage();
  renderPageChrome(doc);
  doc.y = PAGE.marginTop;
}

function renderPageChrome(doc: any) {
  doc
    .save()
    .rect(0, 0, PAGE.width, PAGE.height)
    .fill("#ffffff")
    .restore();

  doc
    .save()
    .rect(0, 0, PAGE.width, 116)
    .fill(COLORS.paper)
    .restore();

  doc
    .save()
    .moveTo(PAGE.marginX, 108)
    .lineTo(PAGE.width - PAGE.marginX, 108)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke()
    .restore();
}

export function generatePropertyEvaluationPdf(input: PropertyEvaluationPdfInput) {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 0,
    // Next's runtime bundle breaks PDFKit's implicit Helvetica lookup, so we start
    // from a concrete system font or no default font at all.
    font: RESOLVED_FONTS.regular ?? null,
    info: {
      Title: `${input.branding.reportTitle} - ${input.context.title}`,
      Author: "Furlong",
      Subject: "Property evaluation advisory report",
      Creator: "Furlong",
      Producer: "Furlong PDF Renderer",
    },
  });

  renderPageChrome(doc);

  imageIfExists(doc, input.branding.compassWatermarkPath, 150, 180, { fit: [320, 320], opacity: 0.06 });
  imageIfExists(doc, input.branding.emblemPath, 472, 34, { fit: [84, 84], opacity: 0.14 });
  imageIfExists(doc, input.branding.logoPath, PAGE.marginX, 28, { fit: [150, 44] });

  applyFont(doc, "bold");
  doc
    .fillColor(COLORS.deep)
    .fontSize(24)
    .text(input.branding.reportTitle, PAGE.marginX, 132, { width: 330 });

  applyFont(doc, "regular");
  doc
    .fillColor(COLORS.text)
    .fontSize(11)
    .text(input.context.title, PAGE.marginX, 166, { width: 320, lineGap: 2 })
    .text(input.context.location + (input.context.exactAddress ? ` · ${input.context.exactAddress}` : ""), PAGE.marginX, doc.y + 2, { width: 330, lineGap: 2 });

  doc
    .fillColor("#ffffff")
    .roundedRect(PAGE.width - 196, 132, 152, 26, 13)
    .fill(COLORS.navy);
  applyFont(doc, "bold");
  doc
    .fillColor("#ffffff")
    .fontSize(10.5)
    .text(`${input.tier.shortLabel} · ${input.tier.label}`, PAGE.width - 184, 140, { width: 128, align: "center" });

  card(doc, PAGE.width - 210, 172, 166, 84, COLORS.softBlue);
  applyFont(doc, "bold");
  doc
    .fillColor(COLORS.muted)
    .fontSize(9.5)
    .text("Generated", PAGE.width - 194, 186)
    .text("Path", PAGE.width - 194, 212)
    .text("Source posture", PAGE.width - 194, 238);
  applyFont(doc, "regular");
  doc
    .fillColor(COLORS.deep)
    .fontSize(10)
    .text(input.branding.generatedDate, PAGE.width - 126, 186, { width: 72, align: "right" })
    .text(["Furlong", ...input.branding.explorationPath].join(" → "), PAGE.width - 126, 212, { width: 72, align: "right" })
    .text(input.context.currentLabel ?? input.context.sourceLabel, PAGE.width - 126, 238, { width: 72, align: "right" });

  card(doc, PAGE.marginX, 218, 250, 88, "#ffffff");
  applyFont(doc, "bold");
  doc.fillColor(COLORS.muted).fontSize(9.5).text("VERDICT", PAGE.marginX + 16, 232);
  applyFont(doc, "bold");
  doc.fillColor(COLORS.deep).fontSize(18).text(input.verdict.label, PAGE.marginX + 16, 248, { width: 218 });
  bodyText(doc, input.verdict.explanation, PAGE.marginX + 16, 274, 218);

  card(doc, 312, 218, 256, 88, "#ffffff");
  applyFont(doc, "bold");
  doc.fillColor(COLORS.muted).fontSize(9.5).text("TIER PURPOSE", 328, 232);
  bodyText(doc, input.tier.description, 328, 250, 224);

  sectionTitle(doc, "Executive Summary", 332);
  card(doc, PAGE.marginX, 348, PAGE.width - PAGE.marginX * 2, 92, "#ffffff");
  bodyText(doc, input.executiveSummary, PAGE.marginX + 18, 364, PAGE.width - PAGE.marginX * 2 - 36);

  sectionTitle(doc, "Property Snapshot", 464);
  card(doc, PAGE.marginX, 480, 252, 122, "#ffffff");
  let leftY = bulletList(doc, input.propertySummary, PAGE.marginX + 16, 496, 220);
  doc.y = Math.max(leftY, 604);

  card(doc, 316, 480, 252, 122, "#ffffff");
  bodyText(
    doc,
    `${input.context.propertyType} · ${input.context.sourceLabel}\n${input.context.priceLabel}`,
    332,
    496,
    220
  );

  doc.y = 628;
  ensureSpace(doc, 200);
  sectionTitle(doc, "Expected Cost Posture and Capital Frame", doc.y);
  doc.y += 16;
  card(doc, PAGE.marginX, doc.y, PAGE.width - PAGE.marginX * 2, 140, "#ffffff");
  doc.y = bulletList(doc, input.conceptSummary, PAGE.marginX + 16, doc.y + 16, PAGE.width - PAGE.marginX * 2 - 32) + 8;

  ensureSpace(doc, 250);
  sectionTitle(doc, "Signals and Constraints", doc.y);
  doc.y += 16;
  const startY = doc.y;
  card(doc, PAGE.marginX, startY, 252, 170, "#ffffff");
  applyFont(doc, "bold");
  doc.fillColor(COLORS.muted).fontSize(9.5).text("STRONGEST SIGNALS", PAGE.marginX + 16, startY + 14);
  bulletList(doc, input.strengths.length > 0 ? input.strengths : ["No meaningful strengths can be stated yet because the file is still too thin."], PAGE.marginX + 16, startY + 32, 220);
  card(doc, 316, startY, 252, 170, "#ffffff");
  applyFont(doc, "bold");
  doc.fillColor(COLORS.muted).fontSize(9.5).text("RISKS AND BLOCKERS", 332, startY + 14);
  bulletList(doc, input.risks, 332, startY + 32, 220);
  doc.y = startY + 190;

  const sections: Array<{ title: string; items: string[] }> = [
    { title: "Ranked Financing Lanes", items: input.pathwayAnalysis },
    { title: "Property Verification Summary", items: input.propertyVerificationSummary },
    { title: "Property-Side Criteria and External Flags", items: input.verifiedCriteria },
    { title: "Basis and Limits of This Analysis", items: input.explainabilityNotes },
    { title: "Questions the Platform Should Already Be Asking", items: input.keyQuestions },
    { title: "Diligence Priorities Before Commitment", items: input.nextMoves },
  ];

  if (input.tier.id === "paid" || input.tier.id === "environmental") {
    sections.splice(3, 0, { title: "Optional Deeper Intake Posture", items: input.readinessSectionNotes });
  }

  if (input.tier.id === "free") {
    sections[0] = { title: "Ranked Financing Lanes", items: input.pathwayAnalysis.slice(0, 1) };
    const controllingQuestionIndex = sections.findIndex((section) => section.title === "Questions the Platform Should Already Be Asking");
    if (controllingQuestionIndex >= 0) {
      sections.splice(controllingQuestionIndex, 1);
    }
  }

  for (const section of sections) {
    ensureSpace(doc, 120);
    sectionTitle(doc, section.title, doc.y);
    doc.y += 16;
    const estimated = Math.max(88, section.items.length * 24 + 26);
    card(doc, PAGE.marginX, doc.y, PAGE.width - PAGE.marginX * 2, estimated, "#ffffff");
    doc.y = bulletList(doc, section.items, PAGE.marginX + 16, doc.y + 16, PAGE.width - PAGE.marginX * 2 - 32) + 10;
  }

  ensureSpace(doc, 140);
  card(doc, PAGE.marginX, PAGE.height - 140, PAGE.width - PAGE.marginX * 2, 96, COLORS.paper);
  bodyText(doc, input.branding.advisoryDisclosure, PAGE.marginX + 16, PAGE.height - 126, PAGE.width - PAGE.marginX * 2 - 32);
  bodyText(doc, input.branding.dataRightsDisclosure, PAGE.marginX + 16, PAGE.height - 98, PAGE.width - PAGE.marginX * 2 - 32);
  bodyText(doc, "Borrowers pay nothing for baseline readiness support. Export rights remain available across report tiers.", PAGE.marginX + 16, PAGE.height - 70, PAGE.width - PAGE.marginX * 2 - 32);
  doc
    .fillColor(COLORS.muted)
    .font(RESOLVED_FONTS.regular ?? "Times-Roman")
    .fontSize(9)
    .text(input.branding.footerText, PAGE.marginX, PAGE.height - 24, { width: PAGE.width - PAGE.marginX * 2, align: "left" })
    .text("Watermarked FURLONG advisory export", PAGE.marginX, PAGE.height - 24, { width: PAGE.width - PAGE.marginX * 2, align: "right" });

  doc.end();
  return doc;
}
