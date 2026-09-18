import { NextResponse } from "next/server";

import { refreshAllSources } from "@/lib/property/sourceRefresh";
import {
  missingRequiredSecretDetail,
  readRequiredSecret,
  secureCompare,
} from "@/lib/security/requestGuards";

function authorized(request: Request): boolean {
  const configured = readRequiredSecret("SOURCE_REFRESH_CRON_SECRET");
  if (!configured) return false;
  const provided =
    request.headers.get("x-source-refresh-secret") ??
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return provided.trim().length > 0 && secureCompare(provided.trim(), configured);
}

export async function POST(request: Request) {
  if (!readRequiredSecret("SOURCE_REFRESH_CRON_SECRET")) {
    return NextResponse.json(
      {
        ok: false,
        error: missingRequiredSecretDetail("SOURCE_REFRESH_CRON_SECRET"),
      },
      { status: 503 }
    );
  }

  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized source refresh request.",
      },
      { status: 401 }
    );
  }

  try {
    const results = await refreshAllSources();
    return NextResponse.json({
      ok: true,
      refreshedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown source refresh failure.",
      },
      { status: 500 }
    );
  }
}
