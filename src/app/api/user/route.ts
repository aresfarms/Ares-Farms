import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const result = await db.select().from(users);

  return NextResponse.json(result);
}
