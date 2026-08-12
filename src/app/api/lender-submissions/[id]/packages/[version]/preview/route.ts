import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { loadPackage } from "@/lib/lender-submission/store";

export async function GET(req: NextRequest, contextParams: { params: Promise<{ id: string; version: string }> }) {
  const { id, version } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.package.preview");
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const pkg = await loadPackage(id, version);
    return NextResponse.json({ ok: true, package: { ...pkg, packageBytes: undefined }, governance: { traceId: context.traceId, previewOnly: true, liveDelivery: "BLOCKED" } });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
