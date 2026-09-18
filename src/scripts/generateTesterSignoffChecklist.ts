/**
 * generateTesterSignoffChecklist — the printable platform sign-off checklist
 * for the independent pre-launch compliance review of financing surfaces.
 *
 * Run:  npx tsx src/scripts/generateTesterSignoffChecklist.ts [outPath]
 * Emits a fillable print PDF: checkbox per item, notes lines per section,
 * and a final decision + signature block. Deterministic content — the date
 * stamps at generation time; the reviewer fills everything else by hand.
 *
 * Master Volume Governance: this is a HUMAN-REVIEW artifact — the platform
 * asserts nothing here; every judgment on the page is the reviewer's.
 */

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const NAVY = "#1f3864";
const INK = "#1a2233";
const MUTED = "#5a6472";
const RULE = "#c9d2e0";
const STAGING_URL = "https://furlong-core-859763772114.us-central1.run.app";

interface Section {
  title: string;
  note?: string;
  items: string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Access & Identity",
    items: [
      `Staging opens at ${STAGING_URL} and Google sign-in as sfraas@aresfarmsinc.com admits you (IAP).`,
      "A non-allowlisted account is walled at Google sign-in — the app never renders.",
      "No public surface asks for SSN, DL, bank, or card numbers anywhere.",
      "“Keep a permanent record” issues an anonymous token; the token alone (no name, no email) reopens the report from the front door.",
    ],
  },
  {
    title: "2. Front Door & Discovery",
    items: [
      "An address check resolves to a full property workspace with lane-appropriate tabs.",
      "The Study Desk lists device-saved analyses and reopens them intact (same lane, same tabs).",
      "The “Have a Furlong token?” card restores a permanent record and reopens the report.",
      "The three lanes (residential / farm / commercial) present distinct, correct workspaces for matching properties.",
    ],
  },
  {
    title: "3. Residential Lane",
    items: [
      "Summary tab shows a real property summary (size, values, type, flood, schools) — never an empty count.",
      "Assessed values read “county-assessed” with the taxation-not-appraisal explanation.",
      "Yard & Garden tab renders soil-matched garden picks plus regional natives with the extension-office boundary.",
      "Both report editions generate: Pro Forma Report (numbers-only) and First-Time Buyer Report (full guidance + the same pro forma as the lender-ready appendix).",
      "On a parcel with no asking price, the pro forma runs on the county-assessed screening basis, and says so; entering an offer overrides it.",
    ],
  },
  {
    title: "4. Farm / Agriculture Lane",
    items: [
      "Agriculture tab ranks enterprises for the actual parcel (live NRCS soil: drainage, capability class) with the one-crop-vs-diversify verdict.",
      "The pro forma (USDA/FSA structure) carries real numbers: Sources & Uses, DSCR coverage solution to the 1.25x floor, soil-constrained enterprise mix, market channels, equipment and irrigation capital.",
      "Environmental tab shows live soils, wetlands (NWI), and EPA facility screen with sources and dates.",
    ],
  },
  {
    title: "5. Commercial Lane",
    items: [
      "Commercial workspace renders its own tabs (no agriculture tab).",
      "The pro forma (SBA structure) includes the alternative-use screen with the zoning-verification boundary.",
    ],
  },
  {
    title: "6. Financial & Capital Module — Licensed-Lender Review",
    note: "Your licensed domain — review every claim as the lender of record.",
    items: [
      "The module facilitates and routes only: nothing qualifies, prices, approves, or promises credit anywhere.",
      "“A program fitting is not you qualifying” framing present; all pricing labeled illustrative from the published 30-year average with its week-of date.",
      "The 0% DOWN callout is honest (“possible for some buyers”) and lands directly on the lender intake form.",
      "The intake form submits and the deal notification reaches sfraas@aresfarmsinc.com.",
      "Fee schedule reads correctly: loans free; Financial Tune-Up; Advisory fee with its range; Env=PE and Fin advisory hourly rates as agreed.",
      "No demographic data collected anywhere in the financing flow (Section 1071 firewall).",
      "No transaction-tied compensation anywhere; Furlong takes no fee tied to a deal.",
    ],
  },
  {
    title: "7. Reports & Documents",
    items: [
      "Residential pro forma is a real lender package: Sources & Uses (balanced), financing structure with modeled loan amounts and P&I, monthly PITI schedule, ten-year projection, qualifying income, priced lanes, cash to close.",
      "Guarantor PFS and opening balance sheet read “INCLUDED WITH THE PERSONAL FINANCIAL MODULE”.",
      "Every document carries its advisory boundary: not a Loan Estimate under TRID, not a quote, commitment, or eligibility finding.",
      "Exhibits carry sourced, dated government facts; no fabricated or undated figures anywhere.",
      "The three report buttons work: View & print, Download, Keep a permanent record.",
    ],
  },
  {
    title: "8. Compliance Boundaries (Platform-Wide)",
    items: [
      "Publisher-not-broker: editorial publishing only; no brokerage conduct, no compensation-offer marketplace.",
      "Advisory-only language holds on every surface: place-facts describe the place, never eligibility.",
      "Broker-compensation transparency section explains disclosed terms and questions without setting or negotiating compensation.",
      "Payments, memberships, and billing remain OFF everywhere.",
    ],
  },
];

function generate(outPath: string): void {
  const doc = new PDFDocument({ size: "LETTER", margins: { top: 54, bottom: 54, left: 54, right: 54 } });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);
  const W = doc.page.width - 108;
  const dateStamp = new Date().toISOString().slice(0, 10);

  const ensure = (needed: number) => {
    if (doc.y + needed > doc.page.height - 64) doc.addPage();
  };

  // ── Masthead ──
  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("FURLONG · STAGING PLATFORM REVIEW", { characterSpacing: 1.2 });
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(20).fillColor(NAVY).text("Platform Sign-Off Checklist");
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(10.5).fillColor(INK).text(
    "Pre-launch tester and compliance review. Work through each item on the staging platform, check what passes, note what does not, and record your decision on the final page. Every judgment on this page is the reviewer's own — the platform asserts nothing here."
  );
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTED);
  doc.text(`Reviewer: Independent Governance / Finance Reviewer · Prepared ${dateStamp}`);
  doc.text(`Staging: ${STAGING_URL} · Access: Google sign-in via IAP (allowlisted)`);
  doc.moveDown(0.3);
  doc.moveTo(54, doc.y).lineTo(54 + W, doc.y).lineWidth(1.5).strokeColor(NAVY).stroke();
  doc.moveDown(0.6);

  // ── Sections ──
  for (const section of SECTIONS) {
    ensure(90);
    doc.font("Helvetica-Bold").fontSize(12.5).fillColor(NAVY).text(section.title);
    if (section.note) {
      doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(MUTED).text(section.note);
    }
    doc.moveDown(0.35);
    for (const item of section.items) {
      ensure(40);
      const y = doc.y;
      doc.rect(54, y + 1, 11, 11).lineWidth(1).strokeColor(INK).stroke();
      doc.font("Helvetica").fontSize(10).fillColor(INK).text(item, 54 + 20, y, { width: W - 20 });
      doc.moveDown(0.45);
      doc.x = 54;
    }
    // Notes lines for the section
    ensure(46);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(MUTED).text("NOTES / EXCEPTIONS", { characterSpacing: 0.8 });
    doc.moveDown(0.2);
    for (let line = 0; line < 2; line += 1) {
      ensure(20);
      const ly = doc.y + 10;
      doc.moveTo(54, ly).lineTo(54 + W, ly).lineWidth(0.6).strokeColor(RULE).stroke();
      doc.y = ly + 4;
    }
    doc.moveDown(0.7);
  }

  // ── Decision + signature ──
  ensure(280);
  doc.moveDown(0.4);
  doc.moveTo(54, doc.y).lineTo(54 + W, doc.y).lineWidth(1.5).strokeColor(NAVY).stroke();
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY).text("Reviewer Decision");
  doc.moveDown(0.4);
  const decisions = [
    "APPROVED — the platform may proceed toward launch as reviewed.",
    "APPROVED WITH CONDITIONS — proceed once the noted exceptions are resolved and re-verified.",
    "NOT APPROVED — material issues; re-review required after the noted items are fixed.",
  ];
  for (const decision of decisions) {
    ensure(24);
    const y = doc.y;
    doc.rect(54, y + 1, 11, 11).lineWidth(1).strokeColor(INK).stroke();
    doc.font("Helvetica").fontSize(10).fillColor(INK).text(decision, 54 + 20, y, { width: W - 20 });
    doc.moveDown(0.5);
    doc.x = 54;
  }
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(MUTED).text("CONDITIONS / MATERIAL ISSUES (IF ANY)", { characterSpacing: 0.8 });
  doc.moveDown(0.2);
  for (let line = 0; line < 3; line += 1) {
    const ly = doc.y + 10;
    doc.moveTo(54, ly).lineTo(54 + W, ly).lineWidth(0.6).strokeColor(RULE).stroke();
    doc.y = ly + 4;
  }
  doc.moveDown(1.2);
  ensure(70);
  const sigY = doc.y + 22;
  const half = W / 2 - 14;
  doc.moveTo(54, sigY).lineTo(54 + half, sigY).lineWidth(0.8).strokeColor(INK).stroke();
  doc.moveTo(54 + half + 28, sigY).lineTo(54 + W, sigY).lineWidth(0.8).strokeColor(INK).stroke();
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
  doc.text("Signature — Independent Reviewer", 54, sigY + 4, { width: half });
  doc.text("Date", 54 + half + 28, sigY + 4, { width: half });
  doc.moveDown(2);
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(
    `Furlong staging platform sign-off · prepared ${dateStamp} · this checklist is a human-review record, not a platform output, warranty, or legal determination.`,
    54, doc.page.height - 76, { width: W }
  );

  doc.end();
  stream.on("finish", () => {
    console.log(`written ${outPath} (${fs.statSync(outPath).size} bytes)`);
  });
}

const out = process.argv[2] ?? path.join(process.cwd(), `furlong-platform-signoff-${new Date().toISOString().slice(0, 10)}.pdf`);
generate(out);
