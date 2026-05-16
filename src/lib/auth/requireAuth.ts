import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * REQUIRE AUTHENTICATED SESSION
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      error: "Unauthorized",
      status: 401,
      session: null,
    };
  }

  return {
    ok: true,
    status: 200,
    session,
  };
}
