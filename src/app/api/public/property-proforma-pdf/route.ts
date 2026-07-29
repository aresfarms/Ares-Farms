import { NextRequest, NextResponse } from "next/server";

import { buildDraftProformaInput, type DraftProformaPropertyArgs } from "@/lib/pdf/draftProformaFromProperty";
import { buildUltimateProformaDocument, evaluateGenerationGate } from "@/lib/pdf/ultimateProformaTemplate";
import { generateLoanProformaPdf } from "@/lib/pdf/generateLoanProformaPdf";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";
import { STATE_FARMLAND, STATE_FARMLAND_PROVENANCE } from "@/lib/property/stateFarmlandGenerated";
import { solveDscrCoverage, DSCR_FLOOR } from "@/lib/property/dscrCoverageSolver";
import { commercialAlternativeUses } from "@/lib/property/commercialAlternativeUses";
import { buildResidentialProformaDocument, type ResidentialProformaArgs } from "@/lib/pdf/residentialProformaDocument";
import type { LoanProformaInput } from "@/lib/pdf/generateLoanProformaPdf";

/**
 * DRAFT pro forma PDF — PUBLIC, property-side screening only (founder
 * direction 2026-07-29: the downloadable pro forma is the real SBA/USDA
 * document structure, not the property report).
 *
 * The Part V generation gate intentionally stays red on borrower-side items,
 * so every output carries the DRAFT banner and the gate checklist that lists
 * exactly what underwriting still requires. No PII is accepted or stored:
 * the payload is property facts + screening numbers only.
 */

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<
    Partial<DraftProformaPropertyArgs> & {
      propertyEvidence?: unknown;
      laneAnswerLines?: unknown;
      assessedTotalValue?: unknown;
      soil?: unknown;
      building?: unknown;
      residential?: unknown;
    }
  >(req, {
    maxBytes: 128 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.body;

  const title = typeof body.propertyTitle === "string" ? body.propertyTitle.slice(0, 160).trim() : "";
  if (!title) {
    return NextResponse.json({ ok: false, error: "propertyTitle is required." }, { status: 400 });
  }
  const isResidentialDoc = (body.lane as string) === "R";
  const lane = body.lane === "A" || body.lane === "B" || body.lane === "C" ? body.lane : "B";
  const num = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  const revenueUnits = Array.isArray(body.revenueUnits)
    ? body.revenueUnits
        .slice(0, 8)
        .map((unit) => ({
          unitName: String(unit?.unitName ?? "").slice(0, 120),
          unitDescription: String(unit?.unitDescription ?? "").slice(0, 400),
          conservativeAnnualNoi: num(unit?.conservativeAnnualNoi) ?? 0,
          stabilizedAnnualNoi: num(unit?.stabilizedAnnualNoi) ?? 0,
          methodology: String(unit?.methodology ?? "").slice(0, 400),
        }))
        .filter((unit) => unit.unitName)
    : [];

  const additionalProperties = Array.isArray(body.additionalProperties)
    ? body.additionalProperties
        .slice(0, 6)
        .map((p) => ({
          title: String(p?.title ?? "").slice(0, 160).trim(),
          location: typeof p?.location === "string" ? p.location.slice(0, 120) : null,
          price: num(p?.price),
        }))
        .filter((p) => p.title)
    : [];

  // ── Residential Pro Forma Report (lane "R") — the numbers-only edition
  // built from the page's own ownership-cost model (founder 2026-07-29:
  // two documents on every lane).
  let document: LoanProformaInput;
  let gateOpenItems = 0;
  if (isResidentialDoc) {
    const resRaw = body.residential as Record<string, unknown> | null | undefined;
    const ownershipCosts = resRaw && typeof resRaw === "object" && resRaw.ownershipCosts && typeof resRaw.ownershipCosts === "object"
      ? (resRaw.ownershipCosts as ResidentialProformaArgs["ownershipCosts"])
      : null;
    const financingLanes = resRaw && Array.isArray(resRaw.financingLanes)
      ? (resRaw.financingLanes as unknown[]).slice(0, 8).map((v) => String(v).slice(0, 120)).filter(Boolean)
      : [];
    // The REAL pro forma body (Sources & Uses → Cash to Close), built by the
    // shared residentialLenderProforma module client-side from the ownership
    // model's raw numbers. Sanitized to plain strings with hard caps.
    const lenderSections = resRaw && Array.isArray(resRaw.lenderSections)
      ? (resRaw.lenderSections as unknown[]).slice(0, 12).flatMap((s) => {
          if (!s || typeof s !== "object") return [];
          const sec = s as Record<string, unknown>;
          if (typeof sec.title !== "string") return [];
          return [{
            title: sec.title.slice(0, 120),
            intro: typeof sec.intro === "string" ? sec.intro.slice(0, 600) : undefined,
            rows: Array.isArray(sec.rows)
              ? (sec.rows as unknown[]).slice(0, 24).flatMap((r) => {
                  if (!r || typeof r !== "object") return [];
                  const row = r as Record<string, unknown>;
                  if (typeof row.label !== "string" || typeof row.value !== "string") return [];
                  return [{ label: row.label.slice(0, 200), value: row.value.slice(0, 400), emphasis: row.emphasis === true }];
                })
              : undefined,
            paragraphs: Array.isArray(sec.paragraphs)
              ? (sec.paragraphs as unknown[]).slice(0, 6).map((p) => String(p).slice(0, 900))
              : undefined,
          }];
        })
      : null;
    document = buildResidentialProformaDocument({
      propertyTitle: title,
      exactAddress: typeof body.exactAddress === "string" ? body.exactAddress.slice(0, 200) : null,
      location: typeof resRaw?.location === "string" ? (resRaw.location as string).slice(0, 160) : null,
      generationDate: new Date().toISOString().slice(0, 10),
      priceLabel: typeof resRaw?.priceLabel === "string" ? (resRaw.priceLabel as string).slice(0, 160) : "Price not yet confirmed",
      ownershipCosts,
      financingLanes,
      lenderSections: lenderSections?.length ? lenderSections : null,
      rates: (() => {
        const r = resRaw?.rates as Record<string, unknown> | null | undefined;
        if (!r || typeof r !== "object") return null;
        const pct = typeof r.mortgage30Pct === "number" && Number.isFinite(r.mortgage30Pct) ? r.mortgage30Pct : null;
        const week = typeof r.mortgageWeekOf === "string" ? r.mortgageWeekOf.slice(0, 20) : null;
        return pct != null ? { mortgage30Pct: pct, mortgageWeekOf: week } : null;
      })(),
    });
  } else {
  // ── Screening value derivation (founder direction 2026-07-29: "we HAVE the
  // numbers"). Many parcels publish no asking price; the pro forma still runs
  // on the best value we verifiably hold, with the basis printed on the page:
  //   entered/listing price → official assessed total value → USDA state
  //   farmland average × acreage. No basis available → the figures honestly
  //   say what they require.
  const stateCode = typeof body.state === "string" ? body.state.slice(0, 40) : null;
  const acreage = num(body.acreage);
  const fsaRatePct = num(body.fsaRatePct);
  const enteredPrice = num(body.acquisitionPrice);
  const assessedTotal = num(body.assessedTotalValue);
  const stateFarmland = stateCode ? STATE_FARMLAND[stateCode.toUpperCase()] : undefined;
  let screeningPrice: number | null = enteredPrice;
  let valuationNote: string | null = enteredPrice != null ? "Asking price / intended offer as entered; appraisal governs" : null;
  if (screeningPrice == null && assessedTotal != null) {
    screeningPrice = assessedTotal;
    valuationNote = "SCREENING VALUE — official assessed total value from the jurisdiction parcel record; asking price and appraisal govern";
  }
  if (screeningPrice == null && acreage != null && acreage > 0 && stateFarmland) {
    screeningPrice = Math.round(acreage * stateFarmland.dollarsPerAcre);
    valuationNote = `SCREENING VALUE — ${acreage.toLocaleString("en-US", { maximumFractionDigits: 2 })} acres × USDA ${stateFarmland.year ?? STATE_FARMLAND_PROVENANCE.asOf} state farm real-estate average ($${stateFarmland.dollarsPerAcre.toLocaleString("en-US")}/acre); asking price and appraisal govern`;
  }

  // Soil/topography constraints (founder direction 2026-07-29): the parcel's
  // SSURGO facts gate what this ground can sustainably grow.
  const soilRaw = body.soil as Record<string, unknown> | null | undefined;
  const soil = soilRaw && typeof soilRaw === "object"
    ? {
        mapUnitName: typeof soilRaw.mapUnitName === "string" ? soilRaw.mapUnitName.slice(0, 160) : null,
        farmlandClass: typeof soilRaw.farmlandClass === "string" ? soilRaw.farmlandClass.slice(0, 120) : null,
        drainageClass: typeof soilRaw.drainageClass === "string" ? soilRaw.drainageClass.slice(0, 80) : null,
        slopePct: num(soilRaw.slopePct),
        capabilityClass: num(soilRaw.capabilityClass),
      }
    : null;

  // Coverage solve (soil-constrained) — also the source of the modeled
  // revenue units, so Part I and IV.3 tell the same soil-aware story.
  let coverageSolution: ReturnType<typeof solveDscrCoverage> | null = null;
  if (lane === "B" && acreage != null && acreage > 0 && screeningPrice != null && fsaRatePct != null) {
    const debtService = (screeningPrice * 0.8 * (fsaRatePct / 100)) / (1 - Math.pow(1 + fsaRatePct / 100, -40));
    coverageSolution = solveDscrCoverage({
      acres: acreage,
      screeningPrice,
      annualDebtService: debtService,
      ratePct: fsaRatePct,
      amortYears: 40,
      ltv: 0.8,
      soil,
    });
  }
  let effectiveRevenueUnits = revenueUnits;
  if (effectiveRevenueUnits.length === 0 && coverageSolution?.bestMix) {
    effectiveRevenueUnits = coverageSolution.bestMix.parts.slice(0, 6).map((part) => ({
      unitName: part.label,
      unitDescription: `${part.sharePct}% of the soil-constrained diversified screening portfolio on ~${acreage!.toLocaleString("en-US", { maximumFractionDigits: 1 })} acres`,
      conservativeAnnualNoi: Math.round(part.annualNoi * 0.75),
      stabilizedAnnualNoi: part.annualNoi,
      methodology: "Soil-constrained screening optimizer over county economics — editable assumptions, not appraisals, bids, or contracts.",
    }));
  }

  const input = buildDraftProformaInput({
    propertyTitle: title,
    exactAddress: typeof body.exactAddress === "string" ? body.exactAddress.slice(0, 200) : null,
    county: typeof body.county === "string" ? body.county.slice(0, 80) : null,
    state: stateCode,
    lane,
    generationDate: new Date().toISOString().slice(0, 10),
    acquisitionPrice: screeningPrice,
    acreage,
    fsaRatePct,
    valuationNote,
    revenueUnits: effectiveRevenueUnits,
    additionalProperties,
  });

  const failures = evaluateGenerationGate(input);
  document = buildUltimateProformaDocument(input, { allowDraft: true });
  gateOpenItems = failures.length;

  // ── IV.3 — Coverage solution (founder direction 2026-07-29): solve for the
  // soil-sustainable enterprise mix that clears the 1.25x floor, or say
  // plainly that none can.
  if (coverageSolution) {
    const dollars = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
    const solution = coverageSolution;
    const mixClears = (solution.bestMix?.dscr ?? 0) >= DSCR_FLOOR;
    const verdictLine =
      solution.verdict === "clears"
        ? mixClears
          ? `CLEARS THE FLOOR — the diversified mix below services the debt at ${(solution.bestMix?.dscr ?? 0).toFixed(2)}x. On this screen, agriculture alone can carry the purchase at the screening price.`
          : `CLEARS THE FLOOR — a single modeled enterprise, ${solution.bestSingle?.label ?? "the best enterprise"}, services the debt at ${(solution.bestSingle?.dscr ?? 0).toFixed(2)}x. The diversified screen alone does not (${(solution.bestMix?.dscr ?? 0).toFixed(2)}x) — clearing the floor on this screen means committing to that enterprise, with the concentration risk and capital requirements that carries. Agriculture can carry this purchase, but only on that plan.`
        : solution.verdict === "close"
          ? `COVERS THE PAYMENT, MISSES THE FLOOR — the best modeled option covers the debt (≥1.0x) but falls ${dollars(solution.gapAnnual ?? 0)}/yr short of the ${DSCR_FLOOR}x lender floor. Documented off-farm income of ${dollars(solution.outsideIncomeNeeded ?? 0)}/yr (counted in GLOBAL coverage), an acquisition price near ${solution.maxSupportablePrice != null ? dollars(solution.maxSupportablePrice) : "a lower level"}, or stronger operator records close the gap.`
          : `NO MODELED COMBINATION CLEARS THE FLOOR — on this screen, no mix of crops, livestock, hay, flowers, or orchard services this debt at the screening price. Agriculture alone will not carry this purchase: plan on documented outside income of ${dollars(solution.outsideIncomeNeeded ?? 0)}/yr (counted in GLOBAL coverage), or an acquisition price near ${solution.maxSupportablePrice != null ? dollars(solution.maxSupportablePrice) : "a substantially lower level"} where the best mix clears ${DSCR_FLOOR}x.`;
    const mixRows = [
      ...(solution.bestMix
        ? solution.bestMix.parts.map((part) => ({
            cells: [`Mix — ${part.label}`, `${part.sharePct}%`, dollars(part.annualNoi), ""],
          }))
        : []),
      ...(solution.bestMix
        ? [{ cells: ["BEST MODELED MIX — TOTAL", "100%", dollars(solution.bestMix.annualNoi), `${solution.bestMix.dscr.toFixed(2)}x`], emphasis: true }]
        : []),
      ...(solution.bestSingle
        ? [{ cells: [`Best single enterprise — ${solution.bestSingle.label}`, "—", dollars(solution.bestSingle.annualNoi), `${solution.bestSingle.dscr.toFixed(2)}x`] }]
        : []),
      { cells: ["Annual debt service (screening)", "—", dollars(solution.annualDebtService), "1.00x basis"] },
      { cells: [`Income required for the ${DSCR_FLOOR}x floor`, "—", dollars(solution.requiredNoi), `${DSCR_FLOOR}x`], emphasis: true },
    ];
    const gateIdx = document.sections.findIndex((s) => s.title.startsWith("PART V"));
    document.sections.splice(gateIdx >= 0 ? gateIdx : document.sections.length, 0, {
      title: `IV.3 — COVERAGE SOLUTION · WHAT CLEARS THE ${DSCR_FLOOR}x FLOOR`,
      leadIns: [{ text: verdictLine, bold: true }],
      tables: [
        {
          table: {
            columns: [
              { header: "Enterprise / measure", width: 0.44, align: "left" },
              { header: "Share", width: 0.12, align: "right" },
              { header: "Annual NOI", width: 0.22, align: "right" },
              { header: "DSCR", width: 0.22, align: "right" },
            ],
            rows: mixRows,
          },
        },
        ...(solution.planRequirements.length > 0
          ? [
              {
                intro: "PLAN REQUIREMENTS & MARKET CHANNELS — equipment capital, irrigation necessity, and where the goods sell (on-farm, local, and internet channels included).",
                introBold: true,
                table: {
                  columns: [
                    { header: "Item", width: 0.34, align: "left" as const },
                    { header: "Detail", width: 0.66, align: "left" as const },
                  ],
                  rows: solution.planRequirements.map((req) => ({ cells: [req.item, req.detail] })),
                },
              },
            ]
          : []),
      ],
      paragraphs: solution.notes,
    });
  }

  // ── Alternative-use screen for commercial (lane A) — a building is often
  // marketed for its last use, not its highest (founder 2026-07-29).
  if (lane === "A") {
    const buildingRaw = body.building as Record<string, unknown> | null | undefined;
    const screen = commercialAlternativeUses({
      zoning: typeof buildingRaw?.zoning === "string" ? buildingRaw.zoning.slice(0, 120) : null,
      landUse: typeof buildingRaw?.landUse === "string" ? buildingRaw.landUse.slice(0, 120) : null,
      squareFeet: num(buildingRaw?.squareFeet),
      town: typeof buildingRaw?.town === "string" ? buildingRaw.town.slice(0, 80) : null,
    });
    const gateIdxA = document.sections.findIndex((s) => s.title.startsWith("PART V"));
    document.sections.splice(gateIdxA >= 0 ? gateIdxA : document.sections.length, 0, {
      title: "ALTERNATIVE-USE SCREEN — MARKETED PURPOSE VS HIGHEST USE",
      leadIns: [{ text: "Uses this building's verified record does not rule out — some may value higher than the purpose it is marketed for.", bold: true }],
      tables: [
        {
          table: {
            columns: [
              { header: "Alternative use", width: 0.24, align: "left" },
              { header: "Why it can out-earn the marketed purpose", width: 0.4, align: "left" },
              { header: "What governs", width: 0.36, align: "left" },
            ],
            rows: screen.uses.map((use) => ({ cells: [use.use, use.why, use.watch] })),
          },
        },
      ],
      paragraphs: [screen.note],
    });
  }

  }

  // ── Property exhibits (founder direction 2026-07-29: ONE document) ────────
  // The verified Land Ledger evidence rides behind the pro forma as exhibits,
  // the way a real loan package carries its supporting documentation.
  const evidence = Array.isArray(body.propertyEvidence)
    ? (body.propertyEvidence as Array<Record<string, unknown>>)
        .slice(0, 48)
        .map((fact) => ({
          label: String(fact?.label ?? "").slice(0, 80),
          value: String(fact?.value ?? "").slice(0, 220),
          source: String(fact?.source ?? "").slice(0, 160),
        }))
        .filter((fact) => fact.label && fact.value)
    : [];
  if (evidence.length > 0) {
    document.sections.push({
      title: "EXHIBIT A — VERIFIED PROPERTY EVIDENCE",
      leadIns: [{ text: "Sourced, dated government facts for the subject property (Furlong Land Ledger).", bold: false }],
      tables: [
        {
          table: {
            columns: [
              { header: "Fact", width: 0.24, align: "left" },
              { header: "Value", width: 0.44, align: "left" },
              { header: "Source", width: 0.32, align: "left" },
            ],
            rows: evidence.map((fact) => ({ cells: [fact.label, fact.value, fact.source] })),
          },
        },
      ],
    });
  }
  const answerLines = Array.isArray(body.laneAnswerLines)
    ? (body.laneAnswerLines as unknown[]).slice(0, 24).map((line) => String(line).slice(0, 600)).filter(Boolean)
    : [];
  if (answerLines.length > 0) {
    document.sections.push({
      title: "EXHIBIT B — PROPERTY QUESTIONS, ANSWERED",
      leadIns: [{ text: "Lane-specific questions answered for the subject property from the verified record.", bold: false }],
      paragraphs: answerLines.map((line) => `— ${line}`),
    });
  }

  const pdf = generateLoanProformaPdf(document);
  const buffer = await streamToBuffer(pdf as unknown as NodeJS.ReadableStream);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${isResidentialDoc ? "furlong-buyer-proforma" : "furlong-draft-proforma"}.pdf"`,
      "X-Furlong-Draft": "true",
      "X-Furlong-Gate-Open-Items": String(gateOpenItems),
      "Cache-Control": "no-store",
    },
  });
}
