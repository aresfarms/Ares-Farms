import { NextRequest } from "next/server";

import { handleConstitutionalDoctrineRoute } from "@/lib/governance/constitutionalDoctrineApi";

export async function GET(req: NextRequest) {
  return handleConstitutionalDoctrineRoute(
    req,
    "runtime.state.get",
    "/api/runtime/state"
  );
}
