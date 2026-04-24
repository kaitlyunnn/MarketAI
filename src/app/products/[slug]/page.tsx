"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  buildOpportunities,
  formatCurrency,
  formatScore,
  getCompetitionLabel,
  type ProductOpportunity,
} from "@/lib/products";
import { createClient } from "../../../../utils/supabase/client";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
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
        setLoading(false);
        return;
      }

      const opportunities = buildOpportunities(data ?? []);
      const matchedProduct =
        opportunities.find((item) => item.slug === params.slug) ?? null;

      if (!matchedProduct) {
        setError("We could not find that product.");
        setLoading(false);
        return;
      }

      setProduct(matchedProduct);
      setLoading(false);
    }

    if (params.slug) {
      void fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [params.slug]);

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <div className="rounded-full border border-white/60 bg-white/65 px-4 py-3 shadow-[0_10px_30px_rgba(55,39,16,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
                MA
              </div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                MarketAI
              </p>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-black/65 transition hover:text-black"
            >
              Back to products
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 space-y-5">
            <div className="h-24 rounded-[2rem] border border-[var(--line)] bg-white/80" />
            <div className="grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="h-36 rounded-[1.75rem] border border-[var(--line)] bg-white/80"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <section className="mt-8 rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-red-900">
            <p className="text-sm font-semibold uppercase tracking-[0.22em]">
              Product unavailable
            </p>
            <p className="mt-2 text-sm leading-6">{error}</p>
          </section>
        ) : product ? (
          <>
            <section className="mt-8 rounded-[2rem] border border-white/55 bg-[var(--panel)] p-8 shadow-[0_30px_80px_rgba(59,40,13,0.12)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Product detail
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {product.productName}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-black/65 sm:text-lg">
                A focused snapshot of this product&apos;s current potential based
                on normalized trend activity, competition pressure, and gross
                margin opportunity.
              </p>
            </section>

            <section className="mt-8 grid gap-5 md:grid-cols-2">
              <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Trend score
                </p>
                <p className="mt-3 text-4xl font-semibold">
                  {formatScore(product.trendScore)}
                </p>
              </article>

              <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Competition level
                </p>
                <p className="mt-3 text-4xl font-semibold">
                  {getCompetitionLabel(product.competitionScore)}
                </p>
              </article>

              <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Profit margin
                </p>
                <p className="mt-3 text-4xl font-semibold">
                  {formatCurrency(product.profitMargin)}
                </p>
              </article>

              <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Opportunity score
                </p>
                <p className="mt-3 text-4xl font-semibold">
                  {formatScore(product.opportunityScore)}
                </p>
              </article>
            </section>

            <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Amazon vs supplier pricing
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Amazon price
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(product.amazonPrice)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Supplier price
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(product.supplierPrice)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Margin
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(product.profitMargin)}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Market pressure
                </p>
                <p className="mt-5 text-sm leading-7 text-black/65">
                  Other sellers currently detected:
                </p>
                <p className="mt-2 text-5xl font-semibold">
                  {product.competitionCount}
                </p>
                <p className="mt-4 text-sm leading-7 text-black/60">
                  This raw seller count feeds the normalized competition score
                  used in the ranking model.
                </p>
              </article>
            </section>

            <section className="mt-8 rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                AI summary placeholder
              </p>
              <p className="mt-4 text-base leading-8 text-black/65">
                This product shows a{" "}
                <span className="font-semibold text-black">
                  {getCompetitionLabel(product.competitionScore).toLowerCase()}
                </span>{" "}
                competition profile with a current margin of{" "}
                <span className="font-semibold text-black">
                  {formatCurrency(product.profitMargin)}
                </span>
                . A future AI summary can explain why this product is promising,
                what risks to watch, and what creative angles to test first.
              </p>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
