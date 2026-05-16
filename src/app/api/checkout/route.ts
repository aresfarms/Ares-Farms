import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

/**
 * STRIPE CHECKOUT SESSION
 * Creates payment session for reports/subscriptions
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      productName,
      price,
      tenantId,
      reportId,
    } = body;

    if (!productName || !price || !tenantId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing productName, price, or tenantId",
        },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],

      metadata: {
        tenantId,
        reportId: reportId || "none",
      },

      success_url: "http://localhost:3000/dashboard?success=true",
      cancel_url: "http://localhost:3000/dashboard?cancelled=true",
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Checkout failed",
      },
      { status: 500 }
    );
  }
}
