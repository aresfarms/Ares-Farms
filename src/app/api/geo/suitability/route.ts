import { NextRequest } from "next/server";

import { handleSourceStackRoute } from "@/lib/source-stack/sourceStackApi";

export async function GET(req: NextRequest) {
  return handleSourceStackRoute(
    req,
    "source-stack.geo-suitability",
    "/api/geo/suitability"
  );
}

export async function POST(req: NextRequest) {
  return handleSourceStackRoute(
    req,
    "source-stack.geo-suitability",
    "/api/geo/suitability"
  );
}
