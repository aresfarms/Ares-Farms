import { NextResponse } from "next/server";

import { runInstitutionalAccessSurveillance } from "@/lib/governance/institutionalAccessSurveillanceOrchestrator";
import { missingRequiredSecretDetail, readRequiredSecret, secureCompare } from "@/lib/security/requestGuards";

function authorized(request: Request): boolean {
  const configured = readRequiredSecret("INSTITUTIONAL_ACCESS_SURVEILLANCE_CRON_SECRET");
  if (!configured) return false;
  const provided = request.headers.get("x-institutional-surveillance-secret") ?? request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return provided.trim().length > 0 && secureCompare(provided.trim(), configured);
}

export async function POST(request: Request) {
  if (!readRequiredSecret("INSTITUTIONAL_ACCESS_SURVEILLANCE_CRON_SECRET")) {
    return NextResponse.json({ ok: false, error: missingRequiredSecretDetail("INSTITUTIONAL_ACCESS_SURVEILLANCE_CRON_SECRET") }, { status: 503 });
  }
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized institutional access surveillance request." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { lookbackHours?: number; exportThreshold?: number; deniedThreshold?: number };
  return NextResponse.json({ ok: true, ...runInstitutionalAccessSurveillance(body) });
}
