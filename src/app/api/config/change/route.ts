import { NextRequest } from "next/server";

import { handleConstitutionalDoctrineRoute } from "@/lib/governance/constitutionalDoctrineApi";

export async function POST(req: NextRequest) {
  return handleConstitutionalDoctrineRoute(
    req,
    "config.change.post",
    "/api/config/change"
  );
}
