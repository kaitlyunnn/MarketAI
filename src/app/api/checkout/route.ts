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

function getConfiguredPurchaseUrl() {
  const configuredPurchaseUrl =
    process.env.STRIPE_PAYMENT_LINK_URL ??
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_URL;

  return configuredPurchaseUrl?.trim() || null;
}

export async function POST(request: NextRequest) {
  const configuredPurchaseUrl = getConfiguredPurchaseUrl();

  if (configuredPurchaseUrl) {
    return NextResponse.json({ url: configuredPurchaseUrl });
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
      success_url: `${appOrigin}/?checkout=success`,
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
