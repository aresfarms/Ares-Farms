import { NextRequest } from "next/server";

import { handleSourceIntelligenceRoute } from "@/lib/source-intelligence/sourceIntelligenceApi";

export async function POST(req: NextRequest) {
  return handleSourceIntelligenceRoute(
    req,
    "scrapers.replay",
    "/api/scrapers/replay"
  );
}
