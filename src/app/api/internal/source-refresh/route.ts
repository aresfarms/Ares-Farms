import { NextResponse } from "next/server";

import { refreshAllSources } from "@/lib/property/sourceRefresh";

function authorized(request: Request): boolean {
  const configured = process.env.SOURCE_REFRESH_CRON_SECRET?.trim();
  if (!configured) return true;
  const provided =
    request.headers.get("x-source-refresh-secret") ??
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return provided.trim() === configured;
}

export async function POST(request: Request) {
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
