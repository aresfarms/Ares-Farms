import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { users } from "@/db/schema";
import { extractSessionAuthorityFromHeaders } from "@/lib/auth/authActivationPolicy";
import { activateJoiner, deprovisionUser } from "@/lib/auth/accessSecurityRuntime";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const authority = extractSessionAuthorityFromHeaders(req.headers);
  if (!authority.authenticated || !authority.actorId || !["admin","governance"].includes(authority.role ?? "")) return NextResponse.json({ok:false,error:"Governed admin authority required."},{status:403});
  const body=await req.json().catch(()=>null) as {userId?:string;event?:"JOINER"|"SUSPEND"|"LEAVER";reason?:string}|null;
  if(!body?.userId||!body.event||!body.reason?.trim()) return NextResponse.json({ok:false,error:"userId, event, and reason are required."},{status:400});
  const target=(await db.select({id:users.id}).from(users).where(eq(users.id,body.userId)).limit(1))[0];
  if(!target) return NextResponse.json({ok:false,error:"Target user not found."},{status:404});
  const result=body.event==="JOINER"?await activateJoiner(target.id,authority.actorId,body.reason):await deprovisionUser({userId:target.id,actorId:authority.actorId,reason:body.reason,event:body.event});
  return NextResponse.json({ok:true,event:body.event,result,governance:{policy:"ZERO-TRUST-JML-001",sessionsRevoked:true}});
}
