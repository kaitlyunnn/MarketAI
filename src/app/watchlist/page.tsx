"use client";

import AppHeader from "@/components/AppHeader";
import {
  buildOpportunities,
  formatCurrency,
  formatScore,
  getCompetitionLabel,
  type ProductOpportunity,
} from "@/lib/products";
import { getWatchlist, getWatchlistLimit } from "@/lib/watchlist";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "../../../utils/supabase/client";

export default function WatchlistPage() {
  const [products, setProducts] = useState<ProductOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [watchlistSlugs, setWatchlistSlugs] = useState<string[]>([]);
  const [watchlistLimit, setWatchlistLimit] = useState(3);

  useEffect(() => {
    let isMounted = true;

    async function loadWatchlist() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      if (!supabase) {
        setError(
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        );
        setLoading(false);
        return;
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      const activeUser = sessionData.session?.user ?? null;

      if (!activeUser) {
        setIsLoggedIn(false);
        setWatchlistSlugs([]);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setWatchlistSlugs(getWatchlist(activeUser).map((entry) => entry.slug));
      setWatchlistLimit(getWatchlistLimit(activeUser));

      const { data, error: productsError } = await supabase
        .from("products")
        .select(
          "product_name, amazon_price, supplier_price, competition_count, tiktok_mentions, google_trends_score, ai_summary",
        );

      if (!isMounted) {
        return;
      }

      if (productsError) {
        setError(productsError.message);
        setLoading(false);
        return;
      }

      setProducts(buildOpportunities(data ?? []));
      setLoading(false);
    }

    void loadWatchlist();

    return () => {
      isMounted = false;
    };
  }, []);

  const watchlistProducts = useMemo(() => {
    return products.filter((product) => watchlistSlugs.includes(product.slug));
  }, [products, watchlistSlugs]);

  return (
    <main className="min-h-screen">
      <AppHeader />

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <section className="rounded-[2rem] border border-white/55 bg-[var(--panel)] p-8 shadow-[0_30px_80px_rgba(59,40,13,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            Watchlist
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Products you want to revisit.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/65 sm:text-lg">
            Keep your highest-priority product ideas in one place and jump back
            into the full detail page whenever you want.
          </p>
        </section>

        {!isLoggedIn && !loading ? (
          <section className="mt-8 rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_18px_50px_rgba(49,33,10,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Members only
            </p>
            <p className="mt-3 text-sm leading-7 text-black/65">
              Log in to save and manage products in your watchlist.
            </p>
            <Link
              href="/auth?mode=login"
              className="mt-5 inline-flex rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Log in
            </Link>
          </section>
        ) : null}

        {error ? (
          <section className="mt-8 rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-red-900">
            <p className="text-sm font-semibold uppercase tracking-[0.22em]">
              Watchlist unavailable
            </p>
            <p className="mt-2 text-sm leading-6">{error}</p>
          </section>
        ) : null}

        {isLoggedIn ? (
          <section className="mt-8 rounded-[1.75rem] border border-[var(--line)] bg-white/70 p-6 shadow-[0_22px_70px_rgba(47,33,12,0.08)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                  Saved products
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  Your watchlist
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-black/60">
                {watchlistProducts.length} of {watchlistLimit} saved on your
                current plan.
              </p>
            </div>

            {loading ? (
              <div className="mt-8 space-y-4">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="h-24 rounded-[1.5rem] border border-[var(--line)] bg-white/75"
                  />
                ))}
              </div>
            ) : watchlistProducts.length ? (
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[var(--line)]">
                <div className="divide-y divide-[var(--line)] bg-white/85">
                  {watchlistProducts.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/products/${product.slug}`}
                      className="grid gap-4 px-5 py-5 md:grid-cols-[1.8fr_0.8fr_0.8fr_0.8fr_0.8fr] md:items-center"
                    >
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.03em]">
                          {product.productName}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-black/60">
                          Amazon {formatCurrency(product.amazonPrice)} -
                          Supplier {formatCurrency(product.supplierPrice)}
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
            ) : (
              <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 text-sm leading-7 text-black/65">
                You have not saved any products yet. Open a product detail page
                and use the watchlist button to save it.
              </div>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}
