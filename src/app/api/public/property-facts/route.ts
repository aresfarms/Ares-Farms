import { NextRequest, NextResponse } from "next/server";
import { resolvePropertyFacts, type PropertyFactsRequest } from "@/lib/property/propertyFactsService";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

/** The public screen and server-generated reports share the same evidence resolver. */
export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<PropertyFactsRequest>(req, { maxBytes: 24 * 1024 });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }
  const payload = await resolvePropertyFacts(parsed.body);
  return NextResponse.json(payload, { status: payload.ok ? 200 : payload.status });
}
