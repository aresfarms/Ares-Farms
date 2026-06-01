import { NextRequest } from "next/server";

import { handleSourceIntelligenceRoute } from "@/lib/source-intelligence/sourceIntelligenceApi";

export async function GET(req: NextRequest) {
  return handleSourceIntelligenceRoute(
    req,
    "properties.canonical",
    "/api/properties/canonical"
  );
}
