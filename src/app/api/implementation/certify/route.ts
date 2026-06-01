import { NextRequest } from "next/server";

import { handleConstitutionalDoctrineRoute } from "@/lib/governance/constitutionalDoctrineApi";

export async function POST(req: NextRequest) {
  return handleConstitutionalDoctrineRoute(
    req,
    "implementation.certify.post",
    "/api/implementation/certify"
  );
}
