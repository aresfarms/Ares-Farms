import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";

const COOKIE = "furlong-professional-test-role";
const ROLES = new Set(["lender", "attorney", "auditor", "sponsor"]);

export async function GET(req: NextRequest) {
  const base = new URL("/professional-access", req.url);
  if (process.env.PROFESSIONAL_TEST_PERSONAS_ENABLED !== "true") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (req.nextUrl.searchParams.get("clear") === "1") {
    const response = NextResponse.redirect(base);
    response.cookies.set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  }

  const role = req.nextUrl.searchParams.get("role")?.trim().toLowerCase() ?? "";
  if (!ROLES.has(role)) return NextResponse.redirect(new URL("/professional-access?testError=invalid-role", req.url));

  const rows = await db.select().from(serviceRequests).where(and(
    eq(serviceRequests.requestType, "professional_credential_verification_request"),
    eq(serviceRequests.contactEmail, "chudson@aresfarmsinc.com"),
    eq(serviceRequests.status, "VERIFIED"),
  )).orderBy(desc(serviceRequests.reviewedAt), desc(serviceRequests.updatedAt)).limit(20);

  const verified = rows.find((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return metadata.professionalRole === role && metadata.testOnly === true &&
      metadata.testPersona === "Pocohantus Smith" && typeof metadata.credentialExpiresAt === "string" &&
      Date.parse(metadata.credentialExpiresAt) >= Date.now();
  });
  if (!verified) return NextResponse.redirect(new URL(`/professional-access/verify?testRole=${encodeURIComponent(role)}`, req.url));

  const destination = role === "lender" ? "/lender-desk" : `/professional-access?testRole=${encodeURIComponent(role)}`;
  const response = NextResponse.redirect(new URL(destination, req.url));
  response.cookies.set(COOKIE, role, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 });
  return response;
}
