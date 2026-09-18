import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { idMeReadiness } from "@/lib/identity/idmeAdapter";
import { plaidReadiness } from "@/lib/plaid/identityMatchAdapter";
import { stripeConfiguredForLivePayments } from "@/lib/stripe/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (email !== "chudson@aresfarmsinc.com") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    stripe: {
      configured: stripeConfiguredForLivePayments(),
      radar: stripeConfiguredForLivePayments(),
      threeDSecurePolicy: process.env.STRIPE_3DS_POLICY?.trim() || "automatic",
    },
    idme: idMeReadiness(),
    plaid: plaidReadiness(),
    releasePolicy: "Payment success never equals SAFE_TO_RELEASE; fraud disposition is evaluated separately.",
  });
}
