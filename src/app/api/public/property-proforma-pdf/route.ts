import { NextRequest, NextResponse } from "next/server";

import { buildDraftProformaInput, type DraftProformaPropertyArgs } from "@/lib/pdf/draftProformaFromProperty";
import { buildUltimateProformaDocument, evaluateGenerationGate } from "@/lib/pdf/ultimateProformaTemplate";
import { generateLoanProformaPdf } from "@/lib/pdf/generateLoanProformaPdf";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

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
  const parsed = await readJsonBodyWithLimit<Partial<DraftProformaPropertyArgs>>(req, {
    maxBytes: 64 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.body;

  const title = typeof body.propertyTitle === "string" ? body.propertyTitle.slice(0, 160).trim() : "";
  if (!title) {
    return NextResponse.json({ ok: false, error: "propertyTitle is required." }, { status: 400 });
  }
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

  const input = buildDraftProformaInput({
    propertyTitle: title,
    exactAddress: typeof body.exactAddress === "string" ? body.exactAddress.slice(0, 200) : null,
    county: typeof body.county === "string" ? body.county.slice(0, 80) : null,
    state: typeof body.state === "string" ? body.state.slice(0, 40) : null,
    lane,
    generationDate: new Date().toISOString().slice(0, 10),
    acquisitionPrice: num(body.acquisitionPrice),
    acreage: num(body.acreage),
    fsaRatePct: num(body.fsaRatePct),
    revenueUnits,
  });

  const failures = evaluateGenerationGate(input);
  const document = buildUltimateProformaDocument(input, { allowDraft: true });
  const pdf = generateLoanProformaPdf(document);
  const buffer = await streamToBuffer(pdf as unknown as NodeJS.ReadableStream);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="furlong-draft-proforma.pdf"`,
      "X-Furlong-Draft": "true",
      "X-Furlong-Gate-Open-Items": String(failures.length),
      "Cache-Control": "no-store",
    },
  });
}
