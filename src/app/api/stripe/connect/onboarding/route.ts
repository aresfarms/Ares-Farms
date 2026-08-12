import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../auth/[...nextauth]/route";
import { createFounderOnboardingLink, type FounderConnectRecipient } from "@/lib/stripe-connect/onboarding";

const RECIPIENTS = new Set(["CAITLIN", "STUART"]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { recipient?: string } | null;
  const value = body?.recipient?.trim().toUpperCase() ?? "";
  if (!RECIPIENTS.has(value)) return NextResponse.json({ ok: false, error: "Invalid recipient" }, { status: 400 });
  const recipient = value as FounderConnectRecipient;
  const ownEmail = recipient === "CAITLIN" ? "chudson@aresfarmsinc.com" : "sfraas@aresfarmsinc.com";
  if (email !== ownEmail && email !== "chudson@aresfarmsinc.com") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
  const traceId = `stripe-connect-onboarding-${recipient.toLowerCase()}-${Date.now()}`;
  const result = await createFounderOnboardingLink(recipient, traceId, baseUrl);
  return NextResponse.json({ ok: true, ...result, recipient });
}
