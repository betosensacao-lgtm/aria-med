import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { pricingPlans } from "../src/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY is not set in .env.local");
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey);

  const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, {
    prepare: false,
  });
  const db = drizzle(client, { schema });

  console.log("Creating Stripe products and prices...\n");

  const plans = await db.select().from(pricingPlans).orderBy(pricingPlans.sortOrder);

  for (const plan of plans) {
    console.log(`--- ${plan.name} ---`);

    let product: Stripe.Product;

    if (plan.stripeProductId) {
      try {
        product = await stripe.products.retrieve(plan.stripeProductId);
        product = await stripe.products.update(plan.stripeProductId, {
          name: plan.name,
          description: plan.description,
        });
        console.log(`  Product updated: ${product.id}`);
      } catch {
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: { planId: plan.id, planSlug: plan.slug },
        });
        console.log(`  Product created: ${product.id}`);
      }
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { planId: plan.id, planSlug: plan.slug },
      });
      console.log(`  Product created: ${product.id}`);
    }

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceMonthly,
      currency: "brl",
      recurring: { interval: "month" },
      metadata: { planId: plan.id, billingCycle: "monthly" },
    });
    console.log(`  Monthly price created: ${monthlyPrice.id} (R$ ${(plan.priceMonthly / 100).toFixed(0)})`);

    const yearlyAmount = plan.priceYearly || plan.priceMonthly * 12;
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: yearlyAmount,
      currency: "brl",
      recurring: { interval: "year" },
      metadata: { planId: plan.id, billingCycle: "yearly" },
    });
    console.log(`  Yearly price created: ${yearlyPrice.id} (R$ ${(yearlyAmount / 100).toFixed(0)})`);

    await db
      .update(pricingPlans)
      .set({
        stripeProductId: product.id,
        stripePriceIdMonthly: monthlyPrice.id,
        stripePriceIdYearly: yearlyPrice.id,
      })
      .where(eq(pricingPlans.id, plan.id));

    console.log(`  DB updated with Stripe IDs.\n`);
  }

  console.log("\nDone! Stripe products created and DB updated.");
  console.log("\nNext steps:");
  console.log("  1. Set STRIPE_WEBHOOK_SECRET in .env.local (from Stripe Dashboard > Webhooks)");
  console.log("  2. Configure the webhook endpoint in Stripe Dashboard:");
  console.log(`     ${process.env.NEXT_PUBLIC_APP_URL || "https://medbook-amber.vercel.app"}/api/stripe/webhook`);
  console.log("  3. Select events: checkout.session.completed, customer.subscription.updated,");
  console.log("     customer.subscription.deleted, invoice.payment_failed");

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
