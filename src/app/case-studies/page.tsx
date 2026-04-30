import Link from "next/link";

import AppHeader from "@/components/AppHeader";
import { caseStudies } from "@/data/caseStudies";

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen">
      <AppHeader />

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <section className="rounded-[2rem] border border-white/55 bg-[var(--panel)] p-8 shadow-[0_30px_80px_rgba(59,40,13,0.12)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            Case Studies
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Breakdown-style brand examples worth studying.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/65 sm:text-lg">
            Explore concise brand case studies focused on positioning, product
            appeal, and the angles that helped these companies stand out.
          </p>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {caseStudies.map((caseStudy) => (
            <article
              key={caseStudy.slug}
              className="flex h-full flex-col rounded-[1.75rem] border border-[var(--line)] bg-white/82 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
                  {caseStudy.category}
                </p>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {caseStudy.brandName}
              </h2>
              <p className="mt-3 text-sm leading-7 text-black/62">
                {caseStudy.shortHook}
              </p>
              <p className="mt-5 text-sm leading-7 text-black/58">
                {caseStudy.overview}
              </p>
              <div className="mt-6">
                <Link
                  href={`/case-studies/${caseStudy.slug}`}
                  className="inline-flex items-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold !text-white transition hover:opacity-90"
                >
                  Read Case Study
                </Link>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
