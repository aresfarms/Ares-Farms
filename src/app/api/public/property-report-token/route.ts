import { NextRequest, NextResponse } from "next/server";

import {
  buildReportContextKey,
  buildReportDigest,
  issueReportAttestation,
} from "@/lib/security/reportAttestation";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

type PropertyReportTokenRequest = {
  report?: {
    tier?: { id?: string | null } | null;
    context?: {
      propertyId?: string | null;
      exactAddress?: string | null;
      title?: string | null;
      importScreeningStatus?: "normal" | "reroute" | null;
      importScreeningCategory?: string | null;
    } | null;
  } | null;
};

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<PropertyReportTokenRequest>(req, {
    maxBytes: 256 * 1024,
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const report = parsed.body.report;
  if (!report || typeof report !== "object") {
    return NextResponse.json({ ok: false, error: "A report payload is required." }, { status: 400 });
  }

  const context = report.context;
  if (!context || !context.title || !report.tier?.id) {
    return NextResponse.json({ ok: false, error: "Report context is incomplete for attestation." }, { status: 400 });
  }

  if (context.importScreeningStatus === "reroute") {
    return NextResponse.json(
      {
        ok: false,
        error:
          context.importScreeningCategory === "restricted-asset"
            ? "Restricted or special assets cannot obtain an ordinary acquisition-style report attestation token."
            : "Rerouted assets cannot obtain an ordinary acquisition-style report attestation token.",
      },
      { status: 422 }
    );
  }

  const digest = buildReportDigest(report);
  const contextKey = buildReportContextKey({
    propertyId: context.propertyId,
    exactAddress: context.exactAddress,
    title: context.title,
    tierId: report.tier.id,
  });

  return NextResponse.json({
    ok: true,
    token: issueReportAttestation({ digest, contextKey }),
  });
}
