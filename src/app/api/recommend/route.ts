import { NextResponse } from "next/server";
import { applyEngine } from "@/lib/engine/applyEngine";

/**
 * 🧠 STUBBED ENTITLEMENT (Phase A safety mode)
 * Keeps system running without SaaS dependencies
 */
function hasEntitlement() {
  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!hasEntitlement()) {
      return NextResponse.json({
        ok: false,
        error: "No entitlement",
      });
    }

    const result = applyEngine(body);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message || "recommend route error",
    });
  }
}
