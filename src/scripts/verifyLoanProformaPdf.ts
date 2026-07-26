/**
 * Synthetic-data harness for the Loan Proforma generator. EVERY name, figure,
 * and contact below is invented — no real borrower data (founder's package is
 * the FORMAT authority only; her figures never enter code or fixtures).
 */
import * as fs from "node:fs";
import { generateLoanProformaPdf, type LoanProformaInput } from "@/lib/pdf/generateLoanProformaPdf";

const input: LoanProformaInput = {
  branding: {
    logoPath: "/brand/furlong-logo.png",
    footerIdentity: "Meadowline Farm, Inc. / Stonebriar Holdings, Inc. — SBA Loan Proforma",
  },
  cover: {
    docTitle: "SBA LOAN PROFORMA & BUSINESS PLAN",
    subtitle: "Recommended Two-Farm Acquisition",
    propertyLine: "Meadowline Farm, VA  +  Stonebriar Creek Farm, NC",
    preparedFor: [
      { name: "A. Banker, VP SBA BDO — Sample Community Bank", detail: "555-010-0100   |   555-010-0101" },
      { name: "L. Lender — Example Capital Partners" },
    ],
    borrowerLine: "Meadowline Farm, Inc.  /  Stonebriar Holdings, Inc.",
    principalLine: "Jordan Q. Sample, PE",
    dateLine: "July 2026",
    confidential: true,
  },
  introParagraphs: [
    "A conservative, defensible plan to acquire and operate a two-farm enterprise on the borrower's own merits. Virginia (Meadowline) is the owner-occupied home base; North Carolina (Stonebriar Creek) is a dedicated premium-hay operation contributed for the equity injection and pledged as collateral. The equity injection is met without outside cash, a seller note, or any trust assets. Two cases are shown — a Conservative (underwriting-grade) case and a Stabilized case at mature operating scale.",
  ],
  sections: [
    {
      title: "SECTION 1 — TRANSACTION BREAKDOWN",
      tables: [
        {
          table: {
            columns: [
              { header: "Line Item", width: 0.4, align: "left" },
              { header: "Amount", width: 0.18 },
              { header: "Notes", width: 0.42 },
            ],
            rows: [
              { cells: ["Purchase — Meadowline Farm, VA (150 ac)", "$2,400,000", "Primary residence; 20-stall barn, two-wing residence."] },
              { cells: ["Purchase — Stonebriar Creek Farm, NC (120 ac)", "$800,000", "Premium alfalfa/clover hay (~80 ac); 4BR/2BA house."] },
              { cells: ["Existing NC mortgage payoff (rolled in)", "$90,000", "Existing note retired at close; consolidated into one note."] },
              { cells: ["TOTAL SBA LOAN REQUEST", "$3,290,000", "SBA 7(a): 90% of purchase + payoff. Under $5M — 85% guarantee tier."], emphasis: true },
              { cells: ["Companion Year-1 working-capital reserve", "$450,000", "Pre-funds Year-1 debt service + operations while revenue ramps (detail, Section 6)."] },
            ],
          },
        },
      ],
    },
    {
      title: "SECTION 2 — COLLATERAL & EQUITY INJECTION",
      tables: [
        {
          table: {
            columns: [
              { header: "Property / Asset", width: 0.4, align: "left" },
              { header: "Stated Value", width: 0.2 },
              { header: "80% Disc.", width: 0.2 },
              { header: "Status", width: 0.2 },
            ],
            rows: [
              { cells: ["Meadowline Farm, VA (purchased)", "$2,400,000", "$1,920,000", "Financed — first lien"] },
              { cells: ["Stonebriar Creek Farm, NC (purchased)", "$800,000", "$640,000", "Financed — first lien"] },
              { cells: ["Owned equipment", "$1,200,000", "$960,000", "Pledged — additional"] },
              { cells: ["TOTAL DISCOUNTED COLLATERAL", "", "$3,520,000", "107% of loan"], emphasis: true },
            ],
          },
        },
      ],
      paragraphs: [
        "Discounted collateral covers the loan 1.07x. The 10% equity injection (~$330,000) is met by contributing the borrower's sole-owned, unencumbered equipment equity — no personal cash beyond the earnest deposit, no standby seller note, and no trust assets pledged or required. A personal guarantee is provided (SBA requires it of any 20%+ owner).",
      ],
    },
    {
      title: "SECTION 3 — DSCR ANALYSIS (TWO CASES)",
      tables: [
        {
          table: {
            columns: [
              { header: "Metric", width: 0.34, align: "left" },
              { header: "Conservative Case", width: 0.24 },
              { header: "Stabilized Case", width: 0.24 },
              { header: "SBA Min", width: 0.18 },
            ],
            rows: [
              { cells: ["Gross revenue", "$1,510,000", "$1,690,000", "—"] },
              { cells: ["Net operating income", "$470,000", "$540,000", "—"] },
              { cells: ["Annual debt service", "$268,000", "$268,000", "—"] },
              { cells: ["NOI margin", "31%", "32%", "—"] },
              { cells: ["Farm DSCR", "1.75x", "2.01x", "1.25x"], emphasis: true },
              { cells: ["Global DSCR (incl. outside income)", "approx. 2.2x", "approx. 2.6x", "1.25x"] },
            ],
          },
        },
      ],
      paragraphs: [
        "Both cases clear the 1.25x SBA floor on defensible, model-documented assumptions. The farm operation alone covers debt service 1.75x in the Conservative (Year-3) case and 2.01x at stabilization. Year-1 debt service is pre-funded by the working-capital reserve (Section 6) while revenue ramps; the six-month interest-only period further eases the build-out year.",
      ],
    },
    {
      title: "SECTION 4 — REVENUE DETAIL BY SEGMENT",
      leadIns: [
        { text: "Virginia — Meadowline Farm (150 ac): diversified produce, value-added livestock, lodging, and a private equine layup facility.", bold: true },
      ],
      tables: [
        {
          table: {
            columns: [
              { header: "Revenue segment", width: 0.56, align: "left" },
              { header: "Conservative", width: 0.22 },
              { header: "Stabilized", width: 0.22 },
            ],
            rows: [
              { cells: ["Hay (sold locally)", "$40,000", "$40,000"] },
              { cells: ["Straw + small grain", "$10,000", "$10,000"] },
              { cells: ["Vegetables (8 ac)", "$176,000", "$176,000"] },
              { cells: ["Cut flowers (6 ac)", "$132,000", "$132,000"] },
              { cells: ["Orchard", "$5,000", "$28,000"] },
              { cells: ["Honey (bees)", "$9,000", "$9,000"] },
              { cells: ["Gourmet mushrooms (woods)", "$21,000", "$27,000"] },
              { cells: ["Guest-wing B&B", "$36,000", "$36,000"] },
              { cells: ["Cottage rental", "$13,200", "$13,200"] },
              { cells: ["Beef cattle", "$32,000", "$36,000"] },
              { cells: ["Meat sheep", "$14,500", "$16,200"] },
              { cells: ["Dairy goats (value-added)", "$10,000", "$14,400"] },
              { cells: ["Eggs (layers)", "$9,700", "$10,800"] },
              { cells: ["Broilers", "$7,200", "$8,000"] },
              { cells: ["Turkeys", "$4,300", "$4,800"] },
              { cells: ["Equine layup board", "$180,000", "$204,000"] },
              { cells: ["Subtotal", "$699,900", "$765,400"], emphasis: true },
            ],
          },
        },
        {
          intro: "North Carolina — Stonebriar Creek (120 ac; ~80 ac hay): hay marketed into the regional shortage market, plus produce and woodland crops.",
          introBold: true,
          table: {
            columns: [
              { header: "Revenue segment", width: 0.56, align: "left" },
              { header: "Conservative", width: 0.22 },
              { header: "Stabilized", width: 0.22 },
            ],
            rows: [
              { cells: ["Premium hay — alfalfa/clover (~80 ac)", "$410,000", "$410,000"] },
              { cells: ["Straw + small grain", "$10,000", "$10,000"] },
              { cells: ["Vegetables (4 ac)", "$88,000", "$88,000"] },
              { cells: ["Cut flowers (2 ac)", "$44,000", "$44,000"] },
              { cells: ["Gourmet mushrooms (woods)", "$21,000", "$27,000"] },
              { cells: ["Cottage rental (long-term)", "$9,000", "$9,000"] },
              { cells: ["Subtotal", "$582,000", "$588,000"], emphasis: true },
            ],
          },
        },
      ],
      paragraphs: [
        "Hay is alfalfa/clover small-square bales (no grass): premium quality marketed where good hay is scarce; the storage barn allows winter-premium timing. Equine is private layup only — no public access. Expansion beyond the base case appears in Section 7 and is not relied upon in any ratio above.",
      ],
    },
    {
      title: "SECTION 5 — NOI BRIDGE",
      tables: [
        {
          table: {
            columns: [
              { header: "Line", width: 0.56, align: "left" },
              { header: "Conservative", width: 0.22 },
              { header: "Stabilized", width: 0.22 },
            ],
            rows: [
              { cells: ["Gross revenue", "$1,510,000", "$1,690,000"] },
              { cells: ["Less: operating expenses (direct + overhead)", "(1,040,000)", "(1,150,000)"] },
              { cells: ["Net Operating Income", "$470,000", "$540,000"], emphasis: true },
              { cells: ["NOI margin", "31%", "32%"] },
            ],
          },
        },
      ],
      paragraphs: [
        "Contribution by property (NOI): Virginia $265,000 / $301,000; North Carolina $205,000 / $239,000 (Conservative / Stabilized).",
      ],
    },
    {
      title: "SECTION 6 — WORKING CAPITAL DETAIL (YEAR 1)",
      tables: [
        {
          table: {
            columns: [
              { header: "Line Item", width: 0.34, align: "left" },
              { header: "Amount", width: 0.16 },
              { header: "Justification", width: 0.5 },
            ],
            rows: [
              { cells: ["Debt-service reserve", "$268,000", "Pre-funds 12 months of loan payments while new-property revenue ramps."] },
              { cells: ["Hired labor — 2 employees + burden", "$120,000", "Two on-site employees at $55k each plus payroll taxes/benefits."] },
              { cells: ["Utilities — two properties", "$28,000", "Residences, barns, cottages, equestrian facility."] },
              { cells: ["Insurance — two properties", "$22,000", "Property, liability, equine (private)."] },
              { cells: ["Feed / vet / certification", "$18,000", "Livestock, vet, and organic certification."] },
              { cells: ["Professional services (CPA, attorney)", "$15,000", "Tax, S-corp remediation, contracts."] },
              { cells: ["Maintenance + repairs", "$14,000", "Routine upkeep."] },
              { cells: ["Marketing / booking platforms", "$9,000", "Internet sales, B&B/cottage listings, hay waitlist."] },
              { cells: ["Contingency", "$6,000", "Operational contingency."] },
              { cells: ["TOTAL WORKING CAPITAL (Year 1)", "$450,000", "Conservative reserve; modeled net Year-1 shortfall is far smaller."], emphasis: true },
            ],
          },
        },
      ],
    },
    {
      title: "SECTION 7 — PHASE 2 UPSIDE (not relied upon in any ratio above)",
      tables: [
        {
          table: {
            columns: [
              { header: "Opportunity", width: 0.34, align: "left" },
              { header: "Notes", width: 0.66 },
            ],
            rows: [
              { cells: ["Value-added dairy expansion", "Cheese and yogurt scale beyond the conservative Year-2 base as the commercial kitchen matures."] },
              { cells: ["Equine capacity", "Filling the 20-stall barn beyond the modeled layup count materially raises VA income."] },
              { cells: ["Specialty crops at maturity", "Orchard and woodland crops continue ramping into years 6–10, lifting later-year NOI."] },
              { cells: ["Price negotiation", "Every $100k off purchase price lowers the loan, the injection, and debt service — added safety margin."] },
            ],
          },
        },
      ],
    },
    {
      title: "SECTION 8 — BORROWER PROFILE",
      tables: [
        {
          table: {
            columns: [
              { header: "Attribute", width: 0.24, align: "left" },
              { header: "Detail", width: 0.76 },
            ],
            rows: [
              { cells: ["Borrower entities", "Meadowline Farm, Inc. (VA S-corp, EIN 00-0000001) — operations.  Stonebriar Holdings, Inc. (VA S-corp, EIN 00-0000002) — real estate."] },
              { cells: ["Guarantor", "Jordan Q. Sample, PE — operator since 2019; independent CPA oversight."] },
              { cells: ["Recurring income", "Fixed outside consulting income of $120,000/yr, reported on the personal return."] },
              { cells: ["Other assets", "Net worth ~$3.2M (Section 10): retirement accounts $1.4M; business equity in both entities."] },
              { cells: ["Credit context", "Clean consumer credit; prior mortgage paid in full."] },
            ],
          },
        },
      ],
    },
    {
      title: "SECTION 9 — WHY SBA / CREDIT-ELSEWHERE",
      paragraphs: [
        "Conventional financing is not available for this transaction. Lenders do not write conventional mortgages on agricultural parcels of this size and type (120+ acres of specialized, illiquid collateral); such properties are served only by the Farm Credit System, FSA, USDA, or SBA. FSA limits are well below the project size and USDA processing is presently impractical, leaving SBA 7(a) — executed through a Preferred Lender — as the appropriate and only practical vehicle, selected for its rate and term.",
      ],
    },
    {
      title: "SECTION 10 — PERSONAL FINANCIAL STATEMENT (GUARANTOR)",
      leadIns: [
        { text: "Jordan Q. Sample, PE — as of June 30, 2026. Figures are documented from IRS transcripts, filed returns, and appraisals/AVMs." },
      ],
      tables: [
        {
          table: {
            columns: [
              { header: "Assets", width: 0.7, align: "left" },
              { header: "Value", width: 0.3 },
            ],
            rows: [
              { cells: ["Cash — checking / savings", "$70,000"] },
              { cells: ["Retirement accounts (IRA / 401k)", "$1,400,000"] },
              { cells: ["Business equity — both entities (book basis)", "$1,600,000"] },
              { cells: ["Vehicles (personal)", "$30,000"] },
              { cells: ["TOTAL ASSETS", "$3,100,000"], emphasis: true },
            ],
          },
        },
        {
          table: {
            columns: [
              { header: "Liabilities", width: 0.7, align: "left" },
              { header: "Balance", width: 0.3 },
            ],
            rows: [
              { cells: ["Student loans", "$18,000"] },
              { cells: ["Auto loan", "$14,000"] },
              { cells: ["TOTAL LIABILITIES", "$32,000"], emphasis: true },
              { cells: ["NET WORTH (Assets − Liabilities)", "$3,068,000"], emphasis: true },
            ],
          },
        },
        {
          table: {
            columns: [
              { header: "Annual Income", width: 0.7, align: "left" },
              { header: "Amount", width: 0.3 },
            ],
            rows: [
              { cells: ["W-2 wages (2025, per IRS wage transcript)", "$210,000"] },
              { cells: ["Consulting income", "$120,000"] },
              { cells: ["TOTAL ANNUAL INCOME", "$330,000"], emphasis: true },
            ],
          },
        },
      ],
    },
  ],
  signatureBlock: {
    certification:
      "Certification: The undersigned certifies that the information in this Personal Financial Statement is true, accurate, and complete as of the date stated, submitted in connection with a commercial loan application. Asset values are stated at conservative documented amounts; contingent assets are disclosed but excluded from stated totals.",
    signerName: "Jordan Q. Sample, PE",
    finePrint:
      "Figures are generated from the borrower's proforma model under conservative, documented assumptions. Supporting documents available on request: full proforma workbook and Letter of Explanation (credit).",
  },
};

const docStream = generateLoanProformaPdf(input);
const chunks: Buffer[] = [];
docStream.on("data", (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
docStream.on("end", () => {
  const out =
    "/tmp/furlong-proforma-sample.pdf";
  fs.writeFileSync(out, Buffer.concat(chunks));
  console.log("WROTE", out, Buffer.concat(chunks).length, "bytes");
});
