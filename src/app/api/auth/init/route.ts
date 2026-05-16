import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email)); // ✅ FIXED

  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  const created = await db
    .insert(users)
    .values({
      id: uuidv4(),
      email,
    })
    .returning();

  return NextResponse.json(created[0]);
}
