import Stripe from "stripe";
import { NextResponse } from "next/server";

import { createAdminClient } from "../../../../../utils/supabase/admin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

async function updateUserPlan(userId: string, plan: "free" | "pro") {
  const supabaseAdmin = createAdminClient();

  if (!supabaseAdmin) {
    return {
      error: "Missing Supabase admin configuration.",
      status: 500,
    } as const;
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError) {
    return {
      error: userError.message,
      status: 500,
    } as const;
  }

  const currentMetadata =
    (userData.user?.user_metadata as Record<string, unknown> | undefined) ?? {};

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        ...currentMetadata,
        plan,
      },
    },
  );

  if (updateError) {
    return {
      error: updateError.message,
      status: 500,
    } as const;
  }

  return { error: null, status: 200 } as const;
}

export async function POST(request: Request) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook configuration." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeWebhookSecret,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid Stripe webhook signature.",
      },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      const result = await updateUserPlan(userId, "pro");

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        );
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (userId) {
      const result = await updateUserPlan(userId, "free");

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        );
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (userId) {
      const activeStatuses = new Set(["active", "trialing"]);
      const nextPlan = activeStatuses.has(subscription.status) ? "pro" : "free";
      const result = await updateUserPlan(userId, nextPlan);

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
