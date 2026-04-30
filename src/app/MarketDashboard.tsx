"use client";

import { type User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import AppHeader from "@/components/AppHeader";
import AuthStatusNotice from "@/components/AuthStatusNotice";
import { getAccessibleProductsTable, isProUser } from "@/lib/account";
import {
  PRODUCT_SELECT_FIELDS,
  buildOpportunities,
  formatCurrency,
  formatScore,
  getCompetitionLabel,
  type ProductOpportunity,
} from "@/lib/products";
import { createClient } from "../../utils/supabase/client";

type SortOption =
  | "opportunity"
  | "profit-margin"
  | "lowest-competition"
  | "most-trending";

function getProductInsight(product: ProductOpportunity) {
  const competition = getCompetitionLabel(
    product.competitionScore,
  ).toLowerCase();
  const strongMargin = product.profitMargin >= 100;
  const solidMargin = product.profitMargin >= 50;
  const highTrend = product.trendScore >= 70;
  const mediumTrend = product.trendScore >= 45;

  if (strongMargin && competition === "low") {
    return "Strong margin with low competition - a solid product to test.";
  }

  if (highTrend && competition !== "high") {
    return "Good demand with manageable competition - worth testing early.";
  }

  if (competition === "low" && !strongMargin) {
    return "Low competition and affordable sourcing make this beginner-friendly.";
  }

  if (solidMargin && mediumTrend) {
    return "Healthy margins and steady demand give this product real potential.";
  }

  if (competition === "medium") {
    return "Balanced demand and competition make this a smart test candidate.";
  }

  return "A promising product to validate before the category gets crowded.";
}

export default function MarketDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productsPerPage = 10;
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("opportunity");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setCheckoutError(sessionError.message);
        return;
      }

      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError(
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        );
        setProducts([]);
        setLoading(false);
        return;
      }

      const productsTable = getAccessibleProductsTable(user);
      const { data, error: supabaseError } = await supabase
        .from(productsTable)
        .select(PRODUCT_SELECT_FIELDS);

      if (!isMounted) {
        return;
      }

      if (supabaseError) {
        setError(supabaseError.message);
        setProducts([]);
        setLoading(false);
        return;
      }

      setProducts(buildOpportunities(data ?? []));
      setLoading(false);
    }

    void fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const activeSupabase = supabase;

    const checkoutState = searchParams.get("checkout");

    if (checkoutState !== "success") {
      setCheckoutProcessing(false);
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 8;

    async function waitForWebhookUpgrade() {
      setCheckoutProcessing(true);
      setCheckoutError(null);

      while (isMounted && attempts < maxAttempts) {
        attempts += 1;

        const { data, error: refreshError } =
          await activeSupabase.auth.refreshSession();

        if (!isMounted) {
          return;
        }

        if (refreshError) {
          setCheckoutError(refreshError.message);
          setCheckoutProcessing(false);
          return;
        }

        const refreshedUser = data.session?.user ?? null;
        setUser(refreshedUser);

        if (isProUser(refreshedUser)) {
          setCheckoutProcessing(false);
          router.replace("/?auth=upgraded");
          router.refresh();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (!isMounted) {
        return;
      }

      setCheckoutProcessing(false);
      setCheckoutError(
        "Your payment went through, but your Pro access is still syncing. Refresh in a moment if it does not appear automatically.",
      );
    }

    void waitForWebhookUpgrade();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, supabase]);

  async function handleCheckout() {
    if (!supabase) {
      setCheckoutError(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
      return;
    }

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const activeUser = sessionData.session?.user ?? null;

      if (!activeUser?.email) {
        setCheckoutError(
          "You need to sign up or log in before purchasing the MarketAI Pro plan.",
        );
        router.push("/auth?mode=signup&reason=pro-purchase");
        return;
      }

      setCheckoutLoading(true);
      setCheckoutError(null);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: activeUser.email,
          userId: activeUser.id,
        }),
      });

      const text = await response.text();
      let body: { url?: string; error?: string } | null = null;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          `Checkout response was not valid JSON: ${text || "<empty response>"}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          body?.error || `Checkout request failed with status ${response.status}`,
        );
      }

      if (!body?.url) {
        throw new Error(body?.error || "Unable to create checkout session.");
      }

      window.location.href = body.url;
    } catch (purchaseError) {
      setCheckoutError(
        purchaseError instanceof Error ? purchaseError.message : "Checkout failed.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = products
    .filter((product) =>
      product.productName.toLowerCase().includes(normalizedQuery),
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "profit-margin":
          return b.profitMargin - a.profitMargin;
        case "lowest-competition":
          return b.competitionScore - a.competitionScore;
        case "most-trending":
          return b.trendScore - a.trendScore;
        case "opportunity":
        default:
          return b.opportunityScore - a.opportunityScore;
      }
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * productsPerPage,
    safeCurrentPage * productsPerPage,
  );
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  const topThree = filteredProducts.slice(0, 3);
  const bestProduct = topThree[0];
  const isProMember = isProUser(user);
  const activeProductsTable = getAccessibleProductsTable(user);

  return (
    <main className="min-h-screen">
      <AppHeader />

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <AuthStatusNotice />

        <section className="relative overflow-hidden rounded-[2rem] border border-white/55 bg-[var(--panel)] px-6 py-8 shadow-[0_30px_80px_rgba(59,40,13,0.12)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center lg:gap-12">
            <div className="flex min-w-0 flex-col gap-8">
              <p className="inline-flex self-start rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-black/70">
                Product opportunities, ranked
              </p>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-7xl">
                  Find winning ecommerce products early.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-black/68 sm:text-xl">
                  MarketAI helps ecommerce sellers discover high-potential
                  products by analyzing demand, profit margin, and competition
                  signals in one place.
                </p>

                <div className="hidden mt-6 flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading || checkoutProcessing || isProMember}
                    className="inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProMember
                      ? "Pro plan active"
                      : checkoutLoading || checkoutProcessing
                        ? "Preparing checkout..."
                        : "Upgrade to MarketAI Pro - $6.99/month"}
                  </button>
                  <p className="text-sm text-black/70">
                    {isProMember
                      ? "Your account already has Pro access, including the expanded product library."
                      : "Sign in first, then complete your secure Stripe checkout to unlock Pro access."}
                  </p>
                </div>

                {checkoutError ? (
                  <p className="hidden rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
                    {checkoutError}
                  </p>
                ) : null}
              </div>

              <section className="rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-5 shadow-[0_16px_40px_rgba(49,33,10,0.04)] sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  How it works
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-3 md:gap-0">
                  {[
                    {
                      step: "01",
                      title: "Analyze data",
                      description:
                        "We evaluate each product using trend, pricing, and competition data.",
                    },
                    {
                      step: "02",
                      title: "Estimate profit",
                      description:
                        "We compare selling price and supplier cost to calculate margins.",
                    },
                    {
                      step: "03",
                      title: "Rank products",
                      description:
                        "Products are scored and ranked so users can quickly spot what is worth testing.",
                    },
                  ].map((item, index) => (
                    <div
                      key={item.step}
                      className={`relative space-y-2.5 md:px-5 ${
                        index > 0
                          ? "border-t border-[var(--line)] pt-4 md:border-l md:border-t-0 md:pt-0"
                          : ""
                      } ${index === 0 ? "md:pl-0" : ""} ${
                        index === 2 ? "md:pr-0" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                          {item.step}
                        </span>
                        {index < 2 ? (
                          <span className="hidden h-px flex-1 bg-[var(--line)] md:block" />
                        ) : null}
                      </div>
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                        {item.title}
                      </h3>
                      <p className="max-w-xs text-sm leading-6 text-black/60">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="self-center rounded-[1.75rem] bg-[var(--ink)] p-6 text-white shadow-[0_30px_90px_rgba(19,18,17,0.28)] lg:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                This Week&apos;s Winning Product
              </p>
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-6">
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-4 w-24 rounded-full bg-white/10" />
                    <div className="h-10 w-3/4 rounded-2xl bg-white/10" />
                    <div className="h-18 w-full rounded-2xl bg-white/10" />
                  </div>
                ) : bestProduct ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/58">
                          Highest opportunity
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                          {bestProduct.productName}
                        </h2>
                      </div>
                      <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                        #{1}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/72">
                      Ranked highest by combining live trend activity, profit
                      margin, and lower seller competition.
                    </p>
                    <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-white/45">
                          Trend
                        </dt>
                        <dd className="mt-2 text-2xl font-semibold">
                          {formatScore(bestProduct.trendScore)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-white/45">
                          Margin
                        </dt>
                        <dd className="mt-2 text-2xl font-semibold">
                          {formatCurrency(bestProduct.profitMargin)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.2em] text-white/45">
                          Opportunity
                        </dt>
                        <dd className="mt-2 text-2xl font-semibold">
                          {formatScore(bestProduct.opportunityScore)}
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                    No products were returned from Supabase yet.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        {error ? (
          <section className="mt-8 rounded-[1.75rem] border border-red-200 bg-red-50 p-5 text-red-900 shadow-[0_12px_40px_rgba(120,25,25,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em]">
              Error loading products
            </p>
            <p className="mt-2 text-sm leading-6">{error}</p>
            <p className="mt-2 text-sm leading-6 text-red-800/80">
              Check your `NEXT_PUBLIC_SUPABASE_URL`,
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and table permissions for
              `{activeProductsTable}`.
            </p>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Best Opportunities Right Now
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                Top 3 Winning Products
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-black/60">
              Ranked by profit potential, competition, and real-time demand
              signals.
            </p>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <article
                  key={card}
                  className="rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]"
                >
                  <div className="h-6 w-24 rounded-full bg-[var(--soft)]" />
                  <div className="mt-5 h-8 w-3/4 rounded-2xl bg-[var(--soft)]" />
                  <div className="mt-3 h-18 rounded-2xl bg-[var(--soft)]" />
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="h-18 rounded-2xl bg-[var(--soft)]" />
                    <div className="h-18 rounded-2xl bg-[var(--soft)]" />
                    <div className="h-18 rounded-2xl bg-[var(--soft)]" />
                  </div>
                </article>
              ))}
            </div>
          ) : topThree.length ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {topThree.map((product, index) => (
                <article
                  key={product.id}
                  className="flex h-full flex-col rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
                      Rank {index + 1}
                    </p>
                    <span className="text-sm text-black/55">
                      Score {formatScore(product.opportunityScore)}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                    {product.productName}
                  </h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-black/62">
                    {getProductInsight(product)}
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-[var(--soft)] p-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        Trend
                      </p>
                      <p className="mt-2 text-xl font-semibold leading-none">
                        {formatScore(product.trendScore)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--soft)] p-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        Profit
                      </p>
                      <p className="mt-2 text-xl font-semibold leading-none">
                        {formatCurrency(product.profitMargin)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--soft)] p-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        Comp
                      </p>
                      <p className="mt-2 break-words text-lg font-semibold leading-tight">
                        {getCompetitionLabel(product.competitionScore)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-6 text-sm leading-7 text-black/65">
              No ranked opportunities yet. Add rows to the Supabase
              `{activeProductsTable}` table and they will appear here.
            </div>
          )}

          <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(248,243,234,0.96),rgba(243,201,134,0.28))] p-6 shadow-[0_28px_80px_rgba(58,39,12,0.12)] sm:p-8">
            <div className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-white/45 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[var(--highlight)]/30 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink)]">
                    MarketAI Pro
                  </p>
                  <p className="text-sm font-medium text-black/58">
                    {isProMember ? "Pro plan active" : "Monthly recurring purchase"}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
                    {isProMember
                      ? "Your Pro plan unlocks the expanded product library"
                      : "Unlock the full product library for $6.99 per month"}
                  </h3>
                  <p className="max-w-2xl text-sm leading-7 text-black/68 sm:text-base">
                    {isProMember
                      ? "You now see the expanded ProProducts catalog and can save up to 10 products to your watchlist."
                      : "Get deeper access to MarketAI with a polished Pro upgrade built for sellers who want more ideas, more saves, and a head start on what is working next."}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "Full product library access",
                    "Watchlist limit increased to 10",
                    "Early access to ecommerce product case studies",
                  ].map((benefit) => (
                    <div
                      key={benefit}
                      className="rounded-[1.4rem] border border-white/65 bg-white/72 p-4 shadow-[0_12px_30px_rgba(58,39,12,0.06)]"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Pro perk
                      </p>
                      <p className="mt-3 text-sm font-medium leading-6 text-[var(--ink)]">
                        {benefit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative rounded-[1.75rem] border border-[var(--line)] bg-[var(--ink)] p-6 text-white shadow-[0_24px_70px_rgba(27,26,24,0.24)] sm:p-7 lg:max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                  {isProMember ? "Plan status" : "Upgrade today"}
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-[-0.05em]">
                    $6.99
                  </span>
                  <span className="pb-1 text-sm text-white/55">monthly</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/72">
                  {isProMember
                    ? "Your account is already on Pro."
                    : "You must be signed in before purchase. Stripe checkout starts after login."}
                </p>
                {isProMember ? (
                  <div className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white/85">
                    Pro plan active
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading || checkoutProcessing}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--highlight)] px-6 py-3.5 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(243,201,134,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkoutLoading || checkoutProcessing
                      ? "Preparing checkout..."
                      : "Start Pro Subscription"}
                  </button>
                )}

                {checkoutError ? (
                  <p className="mt-4 rounded-2xl border border-red-300/30 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900">
                    {checkoutError}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </section>

        <section className="mt-10 rounded-[2rem] border border-[var(--line)] bg-white/70 p-6 shadow-[0_22px_70px_rgba(47,33,12,0.08)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                All Products
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                Ranked opportunity list
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-black/60">
              {isProMember
                ? "You are viewing the expanded ProProducts library."
                : "Click on a product to view its expanded details page"}
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <label className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Search by product name
              </span>
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products..."
                className="mt-2 w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
              />
            </label>

            <label className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Filter
              </span>
              <select
                value={sortOption}
                onChange={(event) => {
                  setSortOption(event.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="mt-2 w-full bg-transparent text-sm text-black outline-none"
              >
                <option value="opportunity">Best overall opportunity</option>
                <option value="profit-margin">Highest profit margin</option>
                <option value="lowest-competition">Lowest competition</option>
                <option value="most-trending">Most trending</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="mt-8 space-y-4">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-24 rounded-[1.5rem] border border-[var(--line)] bg-white/75"
                />
              ))}
            </div>
          ) : filteredProducts.length ? (
            <>
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[var(--line)]">
                <div className="hidden grid-cols-[72px_1.9fr_0.9fr_0.8fr_0.8fr_0.9fr] gap-4 bg-[var(--soft)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] md:grid">
                  <span>Rank</span>
                  <span>Product</span>
                  <span>Margin</span>
                  <span>Trend</span>
                  <span>Competition</span>
                  <span>Opportunity</span>
                </div>

                <div className="divide-y divide-[var(--line)] bg-white/85">
                  {paginatedProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="grid cursor-pointer gap-4 px-5 py-5 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(49,33,10,0.08)] md:grid-cols-[72px_1.9fr_0.9fr_0.8fr_0.8fr_0.9fr] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
                          {(safeCurrentPage - 1) * productsPerPage + index + 1}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.03em]">
                          {product.productName}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-black/60">
                          Amazon {formatCurrency(product.amazonPrice)} - Supplier{" "}
                          {formatCurrency(product.supplierPrice)}
                        </p>
                        <p className="mt-3 text-sm font-medium text-black/70 md:hidden">
                          Trend: {formatScore(product.trendScore)} - Opportunity:{" "}
                          {formatScore(product.opportunityScore)}
                        </p>
                      </div>

                      <div className="text-sm text-black/68">
                        <p className="font-semibold text-black md:hidden">
                          Margin
                        </p>
                        <p>{formatCurrency(product.profitMargin)}</p>
                      </div>

                      <div className="text-sm text-black/68">
                        <p className="font-semibold text-black md:hidden">
                          Trend
                        </p>
                        <p>{formatScore(product.trendScore)}</p>
                      </div>

                      <div className="text-sm text-black/68">
                        <p className="font-semibold text-black md:hidden">
                          Competition
                        </p>
                        <p>{getCompetitionLabel(product.competitionScore)}</p>
                      </div>

                      <div className="text-sm text-black/68">
                        <p className="font-semibold text-black md:hidden">
                          Opportunity
                        </p>
                        <p className="font-semibold text-black">
                          {formatScore(product.opportunityScore)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-black/55">
                  Page {safeCurrentPage} of {totalPages}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={safeCurrentPage === 1}
                    className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Previous
                  </button>
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`h-10 min-w-10 rounded-full px-3 text-sm font-medium transition ${
                        pageNumber === safeCurrentPage
                          ? "bg-[var(--ink)] text-white"
                          : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--soft)]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : products.length ? (
            <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 text-sm leading-7 text-black/65">
              No products match your current search or filter.
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 text-sm leading-7 text-black/65">
              The `{activeProductsTable}` table is reachable, but it returned no
              rows.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
