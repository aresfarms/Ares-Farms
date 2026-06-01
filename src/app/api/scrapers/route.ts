import { NextRequest } from "next/server";

import { handleSourceIntelligenceRoute } from "@/lib/source-intelligence/sourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleSourceIntelligenceRoute(req, "scrapers.list", "/api/scrapers");
}
