import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ensureAccessSecurityState } from "@/lib/auth/accessSecurityRuntime";
import { issueMfaAssurance, MFA_ASSURANCE_COOKIE, MFA_ASSURANCE_MAX_AGE_SECONDS } from "@/lib/auth/mfaAssurance";
import { verifyAuthentication, verifyRegistration } from "@/lib/auth/webauthnMfa";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ ok:false, error:"Authenticated user required." },{status:401});
  const body = await req.json().catch(()=>null) as { mode?:string; challengeId?:string; response?:RegistrationResponseJSON|AuthenticationResponseJSON; label?:string } | null;
  if (!body?.challengeId || !body.response) return NextResponse.json({ok:false,error:"Challenge and passkey response required."},{status:400});
  try {
    if (body.mode === "register") await verifyRegistration(req,user.id,body.challengeId,body.response as RegistrationResponseJSON,body.label);
    else await verifyAuthentication(req,user.id,body.challengeId,body.response as AuthenticationResponseJSON);
    const state = await ensureAccessSecurityState(user.id);
    const secret = resolveNextAuthSecret();
    if (!secret) throw new Error("Session signing secret unavailable.");
    const token = await issueMfaAssurance({userId:user.id,sessionVersion:state.sessionVersion,secret});
    const res = NextResponse.json({ok:true,verified:true,method:"passkey",sessionVersion:state.sessionVersion});
    res.cookies.set(MFA_ASSURANCE_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:MFA_ASSURANCE_MAX_AGE_SECONDS});
    return res;
  } catch (error) {
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:"MFA verification failed."},{status:400});
  }
}
