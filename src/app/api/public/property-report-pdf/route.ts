import { NextRequest, NextResponse } from "next/server";

import { generatePropertyEvaluationPdf } from "@/lib/pdf/generatePropertyEvaluationPdf";
import {
  buildReportContextKey,
  buildReportDigest,
  verifyReportAttestation,
} from "@/lib/security/reportAttestation";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

type PropertyReportRequest = {
  fileName?: string;
  token?: string;
  report: Parameters<typeof generatePropertyEvaluationPdf>[0];
};

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<Partial<PropertyReportRequest>>(req, {
    maxBytes: 256 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const body = parsed.body;
  if (!body.report || typeof body.report !== "object") {
    return NextResponse.json({ ok: false, error: "A report payload is required." }, { status: 400 });
  }

  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json(
      { ok: false, error: "A short-lived report attestation token is required before export." },
      { status: 401 }
    );
  }

  const digest = buildReportDigest(body.report);
  const contextKey = buildReportContextKey({
    propertyId:
      (body.report.context as { propertyId?: string | null } | undefined)?.propertyId ?? null,
    exactAddress: body.report.context?.exactAddress ?? null,
    title: body.report.context?.title ?? null,
    tierId: body.report.tier?.id ?? null,
  });
  const tokenCheck = verifyReportAttestation({
    token: body.token,
    digest,
    contextKey,
  });
  if (!tokenCheck.ok) {
    return NextResponse.json({ ok: false, error: tokenCheck.error }, { status: 401 });
  }

  const screening = body.report.context;
  if (screening?.importScreeningStatus === "reroute") {
    return NextResponse.json({
      ok: false,
      error:
        screening.importScreeningCategory === "restricted-asset"
          ? "Restricted or special assets cannot generate an ordinary acquisition-style PDF from the public property flow."
          : "This asset was rerouted into special-asset posture and cannot generate an ordinary acquisition-style PDF from the public property flow.",
    }, { status: 422 });
  }

  const pdf = generatePropertyEvaluationPdf(body.report as PropertyReportRequest["report"]);
  const buffer = await streamToBuffer(pdf);
  const fileName = body.fileName && body.fileName.trim() ? body.fileName.trim() : "furlong-property-report.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
