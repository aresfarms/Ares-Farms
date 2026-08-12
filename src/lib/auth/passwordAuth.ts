import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";

import { accessSecurityStates, users } from "@/db/schema";
import { db } from "@/lib/db";
import { ensureAccessSecurityState } from "@/lib/auth/accessSecurityRuntime";

const SCRYPT_BYTES = 64;

function hashPassword(password: string, salt: string): Buffer {
  return scryptSync(password, salt, SCRYPT_BYTES);
}

export function passwordMeetsPolicy(password: string): boolean {
  return password.length >= 16;
}

export async function setUserPasswordByEmail(email: string, password: string) {
  if (!passwordMeetsPolicy(password)) throw new Error("PASSWORD_POLICY_FAILED");
  const normalized = email.trim().toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  const user = rows[0];
  if (!user) throw new Error("USER_NOT_FOUND");
  await ensureAccessSecurityState(user.id);
  const salt = randomBytes(24).toString("base64url");
  const hash = hashPassword(password, salt).toString("base64url");
  await db.update(accessSecurityStates).set({
    passwordHash: hash,
    passwordSalt: salt,
    passwordSetAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(accessSecurityStates.userId, user.id));
  return { userId: user.id };
}

export async function verifyUserPasswordByEmail(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const rows = await db.select({
    id: users.id,
    passwordHash: accessSecurityStates.passwordHash,
    passwordSalt: accessSecurityStates.passwordSalt,
  }).from(users)
    .leftJoin(accessSecurityStates, eq(accessSecurityStates.userId, users.id))
    .where(eq(users.email, normalized)).limit(1);
  const row = rows[0];
  if (!row?.passwordHash || !row.passwordSalt) return false;
  const expected = Buffer.from(row.passwordHash, "base64url");
  const actual = hashPassword(password, row.passwordSalt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function userHasPasswordByEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const rows = await db.select({ passwordHash: accessSecurityStates.passwordHash })
    .from(users)
    .leftJoin(accessSecurityStates, eq(accessSecurityStates.userId, users.id))
    .where(eq(users.email, normalized)).limit(1);
  return Boolean(rows[0]?.passwordHash);
}
