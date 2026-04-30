"use client";

import AppHeader from "@/components/AppHeader";
import WatchlistButton from "@/components/WatchlistButton";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getAccessibleProductsTable } from "@/lib/account";
import {
  PRODUCT_SELECT_FIELDS,
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
  const [productTable, setProductTable] = useState("products");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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

      const activeTable = getAccessibleProductsTable(
        sessionData.session?.user ?? null,
      );
      setProductTable(activeTable);

      const { data, error: supabaseError } = await supabase
        .from(activeTable)
        .select(PRODUCT_SELECT_FIELDS);

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

  async function handleGenerateSummary() {
    if (!product) {
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const supabase = createClient();

      if (!supabase) {
        throw new Error(
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        );
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!sessionData.session) {
        throw new Error("Please log in before generating and saving AI summaries.");
      }

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product }),
      });

      const payload = (await response.json()) as {
        summary?: string;
        error?: string;
      };

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Failed to generate AI summary.");
      }

      const { error: updateError } = await supabase
        .from(productTable)
        .update({ ai_summary: payload.summary })
        .eq("product_name", product.productName);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setProduct({
        ...product,
        aiSummary: payload.summary,
      });
    } catch (generationError) {
      setSummaryError(
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate AI summary.",
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <AppHeader />
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <div className="flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_30px_rgba(55,39,16,0.08)] transition hover:bg-[var(--soft)]"
          >
            Back to products
          </Link>
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
            <WatchlistButton productSlug={product.slug} />

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
                AI summary
              </p>
              {product.aiSummary ? (
                <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-black/65">
                  {product.aiSummary}
                </div>
              ) : (
                <>
                  <p className="mt-4 text-base leading-8 text-black/65">
                    Generate a short AI summary with pros, cons, target audience,
                    and a final recommendation for this product opportunity.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={summaryLoading}
                    className="mt-5 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {summaryLoading ? "Generating summary..." : "Generate AI Summary"}
                  </button>
                </>
              )}
              {product.aiSummary ? (
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="mt-5 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {summaryLoading ? "Regenerating summary..." : "Regenerate AI Summary"}
                </button>
              ) : null}
              {summaryError ? (
                <p className="mt-4 text-sm leading-6 text-red-700">
                  {summaryError}
                </p>
              ) : null}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
