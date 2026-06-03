import { NextRequest } from "next/server";

import { handleSourceIntelligenceRoute } from "@/lib/source-intelligence/sourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleSourceIntelligenceRoute(
    req,
    "properties.discovery",
    "/api/properties/discovery"
  );
}
