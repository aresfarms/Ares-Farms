import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "ares_session";

/**
 * 🔐 SESSION HANDLER (NEXT.JS 16 COMPATIBLE)
 */
export async function createSession() {
  const sessionId = uuidv4();

  // ✅ Next.js 16 fix: cookies() is async
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: false, // dev-safe
    path: "/",
    sameSite: "lax",
  });

  return sessionId;
}

/**
 * 🔍 GET SESSION
 */
export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * ❌ CLEAR SESSION
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}
