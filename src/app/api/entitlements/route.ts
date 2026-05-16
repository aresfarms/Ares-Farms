import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { hasEntitlement } from "@/lib/entitlements/store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantId = (session.user as any).tenantId;

    return NextResponse.json({
      tenantId,
      paid: hasEntitlement(tenantId, "paid"),
      environmental: hasEntitlement(
        tenantId,
        "environmental"
      ),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
