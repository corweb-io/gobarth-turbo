import { headers } from "next/headers";
import type Stripe from "stripe";
import { env } from "@/env";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // Handle successful payment
      break;
    case "customer.subscription.deleted":
      // Handle cancellation
      break;
  }

  return new Response(null, { status: 200 });
}
