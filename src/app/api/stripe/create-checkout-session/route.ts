import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { db } from "@/db";
import { clinics, pricingPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { planId, billingCycle } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const cookie = request.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    const session = await verifySessionToken(cookie.value);
    if (!session || !session.clinicId) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    const clinicId = session.clinicId;

    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const [plan] = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.id, planId))
      .limit(1);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const priceId =
      billingCycle === "yearly"
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured for this plan. Run pnpm seed-stripe-products first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutSession = await createCheckoutSession({
      priceId,
      clinicId,
      clinicName: clinic.name,
      email: clinic.email,
      successUrl: `${appUrl}/admin/billing?success=true`,
      cancelUrl: `${appUrl}/admin/billing?canceled=true`,
    });

    await db
      .update(clinics)
      .set({ billingCycle: billingCycle || "monthly" })
      .where(eq(clinics.id, clinicId));

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("[Checkout API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
