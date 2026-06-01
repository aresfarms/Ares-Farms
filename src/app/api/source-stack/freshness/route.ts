import { NextRequest } from "next/server";

import { handleSourceStackRoute } from "@/lib/source-stack/sourceStackApi";

export async function GET(req: NextRequest) {
  return handleSourceStackRoute(
    req,
    "source-stack.freshness",
    "/api/source-stack/freshness"
  );
}

export async function POST(req: NextRequest) {
  return handleSourceStackRoute(
    req,
    "source-stack.freshness",
    "/api/source-stack/freshness"
  );
}
