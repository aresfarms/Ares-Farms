/**
 * residentialProformaDocument — the residential "Pro Forma Report" (founder
 * direction 2026-07-29: two documents on every lane — a First-Time Buyer
 * Report with the full guidance, and a Pro Forma Report that is numbers-only
 * for experienced buyers).
 *
 * Built from the SAME ownership-cost model already rendered on the report
 * page (purchase & cash to close, monthly carrying, ten-year cost bands,
 * equity outlook, financing lanes) — formatted into the institutional
 * navy-table document. Advisory screening only: it is not a Loan Estimate,
 * not a commitment, and collects zero identity; a licensed lender determines
 * actual terms.
 */

import type { LoanProformaInput, ProformaSection } from "@/lib/pdf/generateLoanProformaPdf";

export interface ResidentialProformaArgs {
  propertyTitle: string;
  exactAddress: string | null;
  location: string | null;
  generationDate: string; // YYYY-MM-DD
  priceLabel: string;
  ownershipCosts: {
    priceLine: string;
    scenarios: Array<{ program: string; downPayment: string; monthly: string }>;
    closingLine: string;
    monthlyLines: Array<{ label: string; range: string; note: string }>;
    totalsLines: string[];
    horizonLines: Array<{ label: string; value: string }>;
    equityIntro?: string;
    equityRows?: Array<{ label: string; value: string }>;
    equityDisclaimers?: string[];
    disclaimers: string[];
  } | null;
  financingLanes: string[];
}

export function buildResidentialProformaDocument(args: ResidentialProformaArgs): LoanProformaInput {
  const sections: ProformaSection[] = [];
  const costs = args.ownershipCosts;

  sections.push({
    title: "REPORT MANIFEST",
    tables: [
      {
        table: {
          columns: [
            { header: "Item", width: 0.26, align: "left" },
            { header: "Detail", width: 0.74, align: "left" },
          ],
          rows: [
            { cells: ["Subject property", `${args.propertyTitle}${args.exactAddress ? ` — ${args.exactAddress}` : ""}`] },
            { cells: ["Location", args.location ?? "—"] },
            { cells: ["Price basis", args.priceLabel] },
            { cells: ["Document ID", `FURLONG-DRAFT-R-${args.generationDate.slice(0, 4)}-00`] },
            { cells: ["Date / status", `${args.generationDate}  ·  ADVISORY SCREENING — not a Loan Estimate, commitment, or eligibility finding`] },
          ],
        },
      },
    ],
  });

  if (costs) {
    sections.push({
      title: "SECTION 1 — PURCHASE & CASH TO CLOSE",
      leadIns: [
        { text: costs.priceLine, bold: true },
        { text: costs.closingLine, bold: false },
      ],
      tables: costs.scenarios.length
        ? [
            {
              intro: "Financing scenarios (screening — a lender quote governs):",
              table: {
                columns: [
                  { header: "Program", width: 0.4, align: "left" },
                  { header: "Down payment", width: 0.3, align: "right" },
                  { header: "Monthly (est.)", width: 0.3, align: "right" },
                ],
                rows: costs.scenarios.map((s) => ({ cells: [s.program, s.downPayment, s.monthly] })),
              },
            },
          ]
        : undefined,
    });

    sections.push({
      title: "SECTION 2 — MONTHLY CARRYING MODEL",
      tables: [
        {
          table: {
            columns: [
              { header: "Cost line", width: 0.3, align: "left" },
              { header: "Range", width: 0.24, align: "right" },
              { header: "Basis", width: 0.46, align: "left" },
            ],
            rows: [
              ...costs.monthlyLines.map((line) => ({ cells: [line.label, line.range, line.note] })),
              ...costs.totalsLines.map((line) => ({ cells: [line, "", ""], emphasis: true })),
            ],
          },
        },
      ],
    });

    if (costs.horizonLines.length || (costs.equityRows?.length ?? 0) > 0) {
      sections.push({
        title: "SECTION 3 — TEN-YEAR COST & EQUITY OUTLOOK",
        leadIns: costs.equityIntro ? [{ text: costs.equityIntro, bold: false }] : undefined,
        tables: [
          {
            table: {
              columns: [
                { header: "Measure", width: 0.5, align: "left" },
                { header: "Value", width: 0.5, align: "right" },
              ],
              rows: [
                ...costs.horizonLines.map((line) => ({ cells: [line.label, line.value] })),
                ...(costs.equityRows ?? []).map((row) => ({ cells: [row.label, row.value] })),
              ],
            },
          },
        ],
        paragraphs: costs.equityDisclaimers,
      });
    }
  } else {
    sections.push({
      title: "SECTION 1 — PURCHASE & CASH TO CLOSE",
      paragraphs: [
        "Enter the asking price or your intended offer on the report to model the purchase: down-payment scenarios, cash to close, the monthly carrying model, and the ten-year cost and equity outlook all key off that figure.",
      ],
    });
  }

  if (args.financingLanes.length) {
    sections.push({
      title: "SECTION 4 — FINANCING LANES TO TEST",
      tables: [
        {
          table: {
            columns: [
              { header: "#", width: 0.08, align: "left" },
              { header: "Program family", width: 0.56, align: "left" },
              { header: "Pricing", width: 0.36, align: "left" },
            ],
            rows: args.financingLanes.slice(0, 8).map((laneName, index) => ({
              cells: [String(index + 1), laneName, "Lender quote required"],
            })),
          },
        },
      ],
      paragraphs: [
        "Ranked screening order only — which program you qualify for turns on credit, income, occupancy, and the lender's underwriting. A licensed lender confirms fit in one conversation.",
      ],
    });
  }

  sections.push({
    title: "ADVISORY BOUNDARY",
    paragraphs: [
      ...(costs?.disclaimers ?? []),
      "This document is an advisory screening pro forma prepared without collecting any personal information. It is not a Loan Estimate under TRID, not a rate quote, not a commitment to lend, and not an eligibility or approval finding. Property taxes, insurance, and rates change; the figures are ranges built from published sources with their dates. A licensed lender and your own diligence govern every number before reliance.",
    ],
  });

  return {
    branding: { logoPath: "/brand/furlong-logo.png", footerIdentity: "Furlong — Residential Buyer Pro Forma (advisory screening)" },
    cover: {
      docTitle: "RESIDENTIAL BUYER PRO FORMA",
      subtitle: args.propertyTitle,
      propertyLine: args.location ?? args.exactAddress ?? "Subject property",
      preparedFor: [{ name: "Prepared for the requesting visitor", detail: "Anonymous — no identity collected" }],
      borrowerLine: "Buyer identity supplied only at a licensed lender, never here",
      principalLine: "Numbers-only edition — the First-Time Buyer Report carries the full guidance",
      dateLine: args.generationDate,
      confidential: false,
    },
    introParagraphs: [
      "This is the numbers-only edition of the Furlong analysis for experienced buyers: purchase and cash-to-close scenarios, the monthly carrying model, the ten-year cost and equity outlook, and the financing lanes worth testing — each figure carrying its basis. The companion First-Time Buyer Report explains every concept in full; this document assumes you know them.",
    ],
    sections,
  };
}
