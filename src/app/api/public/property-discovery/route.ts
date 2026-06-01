import { NextRequest } from "next/server";

import { handlePublicSourceIntelligenceRoute } from "@/lib/source-stack/publicSourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handlePublicSourceIntelligenceRoute(
    req,
    "property-discovery",
    "/api/public/property-discovery"
  );
}
