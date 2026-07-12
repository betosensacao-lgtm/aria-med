import Stripe from "stripe";

let stripe: Stripe;

export function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key);
  }
  return stripe;
}

export async function createCheckoutSession(opts: {
  priceId: string;
  clinicId: string;
  clinicName: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: opts.priceId, quantity: 1 }],
    customer_email: opts.email,
    metadata: { clinicId: opts.clinicId },
    subscription_data: { metadata: { clinicId: opts.clinicId } },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });
  return session;
}

export async function createPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}) {
  return getStripe().billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
}
