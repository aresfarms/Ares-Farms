import { NextRequest } from "next/server";

import { handleConstitutionalDoctrineRoute } from "@/lib/governance/constitutionalDoctrineApi";

export async function POST(req: NextRequest) {
  return handleConstitutionalDoctrineRoute(
    req,
    "ux.validate.post",
    "/api/ux/validate"
  );
}
