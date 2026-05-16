import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PLANS } from "@/lib/billing/plans";

export async function POST(req: Request) {
  try {
    /**
     * 🔐 AUTH CHECK
     */
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /**
     * 📥 INPUT
     */
    const { plan } = await req.json();

    const selected = PLANS[plan as keyof typeof PLANS];

    if (!selected) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    /**
     * 💳 STRIPE CHECKOUT SESSION
     */
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: selected.name,
            },
            unit_amount: Math.round(selected.price * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        tenantId: (session.user as any).tenantId,
        plan,
      },

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
