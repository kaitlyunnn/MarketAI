import Stripe from "stripe";
import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_PRODUCT = {
  name: "MarketAI Pro access",
  description:
    "Monthly access to the full product library, a larger wishlist, and early case study access.",
  amount: 699,
  currency: "usd",
};

let stripeClient: Stripe | null = null;

type CheckoutRequestBody = {
  email?: string;
  userId?: string;
};

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey);
  }

  return stripeClient;
}

function getAppOrigin(request: NextRequest) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    return configuredAppUrl.replace(/\/+$/, "");
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
  const email = body.email?.trim();
  const userId = body.userId?.trim();

  if (!email || !userId) {
    return NextResponse.json(
      { error: "You must be signed in before starting checkout." },
      { status: 400 },
    );
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Missing STRIPE_SECRET_KEY or STRIPE_PAYMENT_LINK_URL environment variable.",
      },
      { status: 500 },
    );
  }

  const appOrigin = getAppOrigin(request);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        email,
      },
      line_items: [
        {
          price_data: {
            currency: DEFAULT_PRODUCT.currency,
            product_data: {
              name: DEFAULT_PRODUCT.name,
              description: DEFAULT_PRODUCT.description,
            },
            unit_amount: DEFAULT_PRODUCT.amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appOrigin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin}/?checkout=canceled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Checkout session creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
