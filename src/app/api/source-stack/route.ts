import { NextRequest } from "next/server";

import { handleSourceStackRoute } from "@/lib/source-stack/sourceStackApi";

export async function GET(req: NextRequest) {
  return handleSourceStackRoute(req, "source-stack.overview", "/api/source-stack");
}

export async function POST(req: NextRequest) {
  return handleSourceStackRoute(req, "source-stack.overview", "/api/source-stack");
}
