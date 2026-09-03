import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../auth/[...nextauth]/route";
import { founderConnectStatus, type FounderConnectRecipient } from "@/lib/stripe-connect/onboarding";

const RECIPIENTS = new Set(["CAITLIN"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const value = url.searchParams.get("recipient")?.trim().toUpperCase() ?? "";
  if (!RECIPIENTS.has(value)) return NextResponse.json({ ok: false, error: "Invalid recipient" }, { status: 400 });
  const recipient = value as FounderConnectRecipient;
  const ownEmail = recipient === "CAITLIN" ? "chudson@aresfarmsinc.com" : "sfraas@aresfarmsinc.com";
  if (email !== ownEmail && email !== "chudson@aresfarmsinc.com") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, status: await founderConnectStatus(recipient) });
}
