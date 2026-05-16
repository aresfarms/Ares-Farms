import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { grantEntitlement } from "@/lib/entitlements/store";

/**
 * 💳 STRIPE WEBHOOK (STUB SAFE VERSION)
 * Compatible with Next.js 16 async headers API
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();

    // ✅ Next.js 16 fix: headers() is async
    const headerStore = await headers();
    const sig = headerStore.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { ok: false, error: "Missing stripe signature" },
        { status: 400 }
      );
    }

    /**
     * 🧠 STUB MODE:
     * We are NOT verifying Stripe signature in Phase A
     * (real Stripe verification added in Phase 10)
     */

    let event: any;

    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    /**
     * 💡 HANDLE FAKE STRIPE EVENTS
     */
    if (event.type === "checkout.session.completed") {
      const tenantId =
        event?.data?.object?.metadata?.tenantId || "dev";

      // grant entitlement automatically on checkout success
      grantEntitlement(tenantId, "pro", [
        "paid",
        "environmental",
      ]);
    }

    return NextResponse.json({
      ok: true,
      received: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "webhook error",
      },
      { status: 500 }
    );
  }
}
