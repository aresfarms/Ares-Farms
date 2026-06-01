import { NextRequest } from "next/server";

import { handleSourceStackRoute } from "@/lib/source-stack/sourceStackApi";

export async function GET(req: NextRequest) {
  return handleSourceStackRoute(
    req,
    "source-stack.canonicalization",
    "/api/source-stack/canonicalization"
  );
}

export async function POST(req: NextRequest) {
  return handleSourceStackRoute(
    req,
    "source-stack.canonicalization",
    "/api/source-stack/canonicalization"
  );
}
