import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authenticationOptions, registrationOptions } from "@/lib/auth/webauthnMfa";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
  if (!user?.id || !user.email) return NextResponse.json({ ok:false, error:"Authenticated user required." },{status:401});
  const body = await req.json().catch(()=>({})) as { mode?: string };
  try {
    const payload = body.mode === "register"
      ? await registrationOptions(req, { id:user.id, email:user.email, name:user.name })
      : await authenticationOptions(req, user.id);
    return NextResponse.json({ ok:true, ...payload });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error instanceof Error ? error.message : "MFA options failed." },{status:400});
  }
}
