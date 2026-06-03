import { NextRequest } from "next/server";

import { handleConstitutionalDoctrineRoute } from "@/lib/governance/constitutionalDoctrineApi";

export async function POST(req: NextRequest) {
  return handleConstitutionalDoctrineRoute(
    req,
    "runtime.transition.post",
    "/api/runtime/transition"
  );
}
