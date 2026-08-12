import { NextRequest, NextResponse } from "next/server";
import { lenderSubmissionDenied, lenderSubmissionError, lenderSubmissionRequestContext } from "@/lib/lender-submission/api";
import { buildAndPersistPackage } from "@/lib/lender-submission/store";
import type { PackageSource } from "@/lib/lender-submission/runtime";

export async function POST(req: NextRequest, contextParams: { params: Promise<{ id: string }> }) {
  const { id } = await contextParams.params;
  const context = lenderSubmissionRequestContext(req, "lender-submission.build");
  if (!context.allowed) return lenderSubmissionDenied(context);
  try {
    const body = await req.json() as { frozenAt?: string; sources?: Array<Omit<PackageSource, "content"> & { content?: string; contentBase64?: string }> };
    const sources = (body.sources ?? []).map((source) => ({ ...source, content: source.contentBase64 ? Buffer.from(source.contentBase64, "base64") : source.content ?? "" }));
    const built = await buildAndPersistPackage({ caseId: id, frozenAt: body.frozenAt ?? new Date().toISOString(), sources, actorId: context.actorId, traceId: context.traceId });
    return NextResponse.json({ ok: true, package: { ...built, packageBytes: built.packageBytes.toString("base64") }, governance: { traceId: context.traceId, deterministic: true, liveDelivery: "BLOCKED" } });
  } catch (error) { return lenderSubmissionError(error, context.traceId); }
}
