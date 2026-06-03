import { db } from "@/lib/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function calculatePropertyScore(propertyId: string) {
  const property = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property[0]) {
    throw new Error("Property not found");
  }

  return {
    propertyId,
    score: 0,
    status: "pending",
    data: property[0],
  };
}
