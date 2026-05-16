import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { stateToFederalRegion } from "@/lib/geo/federalRegions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      email,
      name,
      address,
      city,
      state,
      county,
      internalRegion = "default",
    } = body;

    // REQUIRED FIELDS
    if (!userId || !email || !state || !county) {
      return NextResponse.json(
        { error: "userId, email, state, and county are required" },
        { status: 400 }
      );
    }

    // derive US federal region
    const federalRegion = stateToFederalRegion[state];

    if (!federalRegion) {
      return NextResponse.json(
        { error: "Invalid state: cannot derive federal region" },
        { status: 400 }
      );
    }

    // check user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // create user if missing
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: uuidv4(),
        email,
        name: name ?? null,
      });
    }

    // create property
    const property = await db
      .insert(properties)
      .values({
        id: uuidv4(),
        userId,
        name: name ?? null,
        address: address ?? null,
        city: city ?? null,
        state,
        county,
        federalRegion,
        internalRegion,
        country: "US",
      })
      .returning();

    return NextResponse.json(property[0]);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
