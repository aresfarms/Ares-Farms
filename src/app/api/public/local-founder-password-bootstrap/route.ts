import { NextResponse } from "next/server";

import { ensureDurableIdentity } from "@/lib/auth/identity";
import { setUserPasswordByEmail, userHasPasswordByEmail } from "@/lib/auth/passwordAuth";

const FOUNDER_EMAIL = "chudson@aresfarmsinc.com";

function localOnly(request: Request): boolean {
  const url = new URL(request.url);
  return process.env.NODE_ENV !== "production" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
}

export async function GET(request: Request) {
  if (!localOnly(request)) return new NextResponse(null, { status: 404 });
  const configured = await userHasPasswordByEmail(FOUNDER_EMAIL).catch(() => false);
  return NextResponse.json({ configured });
}

export async function POST(request: Request) {
  if (!localOnly(request)) return new NextResponse(null, { status: 404 });
  const alreadyConfigured = await userHasPasswordByEmail(FOUNDER_EMAIL).catch(() => false);
  if (alreadyConfigured) return NextResponse.json({ error: "PASSWORD_ALREADY_CONFIGURED" }, { status: 409 });
  const body = await request.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 16) return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  await ensureDurableIdentity({ email: FOUNDER_EMAIL, role: "governance", traceId: `password-bootstrap-${Date.now()}`, source: "security.password.bootstrap" });
  await setUserPasswordByEmail(FOUNDER_EMAIL, password);
  return NextResponse.json({ ok: true });
}
