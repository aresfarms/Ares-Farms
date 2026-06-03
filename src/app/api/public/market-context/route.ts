import { NextRequest } from "next/server";

import { handlePublicSourceIntelligenceRoute } from "@/lib/source-stack/publicSourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handlePublicSourceIntelligenceRoute(
    req,
    "market-context",
    "/api/public/market-context"
  );
}
