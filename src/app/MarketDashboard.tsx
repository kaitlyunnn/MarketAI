"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
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

export default function MarketDashboard() {
  const [products, setProducts] = useState<ProductOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("opportunity");

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      if (!supabase) {
        setError(
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        );
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("products")
        .select(
          "product_name, amazon_price, supplier_price, competition_count, tiktok_mentions, google_trends_score",
        );

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
  }, []);

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

  const topThree = filteredProducts.slice(0, 3);
  const bestProduct = topThree[0];
  const highestTrend = products.length
    ? Math.max(...products.map((product) => product.trendScore))
    : 0;
  const averageProfitMargin = products.length
    ? products.reduce((sum, product) => sum + product.profitMargin, 0) /
      products.length
    : 0;
  const averageCompetitionScore = products.length
    ? products.reduce((sum, product) => sum + product.competitionScore, 0) /
      products.length
    : 0;

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <div className="rounded-full border border-white/60 bg-white/65 px-4 py-3 shadow-[0_10px_30px_rgba(55,39,16,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
              MA
            </div>
            <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
              MarketAI
            </p>
          </div>
        </div>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/55 bg-[var(--panel)] px-6 py-10 shadow-[0_30px_80px_rgba(59,40,13,0.12)] sm:px-10 lg:px-12 lg:py-14">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,_rgba(241,171,76,0.28),_transparent_45%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-7">
              <p className="inline-flex rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-black/70">
                Stop guessing what to sell next
              </p>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-7xl">
                  Find ecommerce products worth testing before everyone else does.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-black/68 sm:text-xl">
                  MarketAI helps ecommerce sellers stop guessing. It ranks
                  products by trend, profit, and competition so users can
                  quickly find products worth testing.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-3xl border border-[var(--line)] bg-white/80 p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                    Trend
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {loading ? "--" : formatScore(highestTrend)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    Highest live trend score across TikTok mentions and Google
                    Trends.
                  </p>
                </article>
                <article className="rounded-3xl border border-[var(--line)] bg-white/80 p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                    Avg margin
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {loading ? "--" : formatCurrency(averageProfitMargin)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    Average profit margin using amazon price minus supplier
                    price.
                  </p>
                </article>
                <article className="rounded-3xl border border-[var(--line)] bg-white/80 p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                    Competition
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {loading ? "--" : formatScore(averageCompetitionScore)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    Higher scores mean fewer sellers are competing on the same
                    product.
                  </p>
                </article>
              </div>
            </div>

            <aside className="rounded-[1.75rem] bg-[var(--ink)] p-6 text-white shadow-[0_30px_90px_rgba(19,18,17,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                This Week&apos;s Best Bet
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
                          Opportunity leader
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
            <p className="mt-2 text-sm leading-6">
              {error}
            </p>
            <p className="mt-2 text-sm leading-6 text-red-800/80">
              Check your `NEXT_PUBLIC_SUPABASE_URL`,
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and table permissions for
              `products`.
            </p>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Top 3 Opportunities Right Now
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                The strongest products to test first
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-black/60">
              Ranked using your in-app scoring formula for trend, profit margin,
              and low competition.
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
                  className="rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]"
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
                  <p className="mt-3 text-sm leading-7 text-black/62">
                    Amazon {formatCurrency(product.amazonPrice)} - Supplier{" "}
                    {formatCurrency(product.supplierPrice)} = Margin{" "}
                    {formatCurrency(product.profitMargin)}
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-[var(--soft)] p-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        Trend
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatScore(product.trendScore)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--soft)] p-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        Margin
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatCurrency(product.profitMargin)}
                      </p>
                    </div>
                  <div className="rounded-2xl bg-[var(--soft)] p-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Competition
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {getCompetitionLabel(product.competitionScore)}
                    </p>
                  </div>
                </div>
              </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-6 text-sm leading-7 text-black/65">
              No ranked opportunities yet. Add rows to the Supabase `products`
              table and they will appear here.
            </div>
          )}
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
              Live products from Supabase, sorted by opportunity score.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <label className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Search by product name
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
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
                {filteredProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="grid gap-4 px-5 py-5 md:grid-cols-[72px_1.9fr_0.9fr_0.8fr_0.8fr_0.9fr] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
                        {index + 1}
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
                      <p className="font-semibold text-black md:hidden">Margin</p>
                      <p>{formatCurrency(product.profitMargin)}</p>
                    </div>

                    <div className="text-sm text-black/68">
                      <p className="font-semibold text-black md:hidden">Trend</p>
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
          ) : products.length ? (
            <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 text-sm leading-7 text-black/65">
              No products match your current search or filter.
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 text-sm leading-7 text-black/65">
              The `products` table is reachable, but it returned no rows.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
