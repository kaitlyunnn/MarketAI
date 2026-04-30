import Stripe from "stripe";
import { NextResponse } from "next/server";

let stripeClient: Stripe | null = null;

type CheckoutConfirmBody = {
  sessionId?: string;
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

export async function POST(request: Request) {
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY environment variable." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutConfirmBody;
  const sessionId = body.sessionId?.trim();
  const userId = body.userId?.trim();

  if (!sessionId || !userId) {
    return NextResponse.json(
      { error: "Missing checkout session information." },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.client_reference_id !== userId) {
      return NextResponse.json(
        { error: "This checkout session does not belong to the current user." },
        { status: 403 },
      );
    }

    if (session.status !== "complete") {
      return NextResponse.json(
        { error: "Your checkout is not complete yet." },
        { status: 400 },
      );
    }

    return NextResponse.json({ pro: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Checkout confirmation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
