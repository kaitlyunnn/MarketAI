import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { getUserPlan } from "@/lib/account";
import { canAccessCaseStudy } from "@/lib/caseStudies";
import { caseStudies, getCaseStudyBySlug } from "@/data/caseStudies";
import { createClient } from "../../../../utils/supabase/server";

type CaseStudyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return caseStudies.map((caseStudy) => ({
    slug: caseStudy.slug,
  }));
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    return {
      title: "Case Study Not Found | MarketAI",
    };
  }

  return {
    title: `${caseStudy.brandName} Case Study | MarketAI`,
    description: caseStudy.shortHook,
  };
}

export default async function CaseStudyDetailPage({
  params,
}: CaseStudyPageProps) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  const caseStudyIndex = caseStudies.findIndex((entry) => entry.slug === slug);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const sessionResult = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null }, error: null };
  const activeUser = sessionResult.data.session?.user ?? null;
  const plan = getUserPlan(activeUser);
  const hasAccess = canAccessCaseStudy(caseStudyIndex, plan);
  const upgradeHref = activeUser ? "/" : "/auth?mode=signup";

  return (
    <main className="min-h-screen">
      <AppHeader />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <div className="flex justify-end">
          <Link
            href="/case-studies"
            className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_30px_rgba(55,39,16,0.08)] transition hover:bg-[var(--soft)]"
          >
            Back to Case Studies
          </Link>
        </div>

        {!hasAccess ? (
          <section className="mt-8 rounded-[2rem] border border-white/55 bg-[var(--panel)] p-8 shadow-[0_30px_80px_rgba(59,40,13,0.12)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              Pro Case Study
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
              This case study is available on MarketAI Pro.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-black/65 sm:text-lg">
              Upgrade to unlock the full case study library and read complete
              breakdowns for brands like {caseStudy.brandName}.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={upgradeHref}
                className="inline-flex items-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Upgrade to Pro
              </Link>
              <Link
                href="/case-studies"
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--soft)]"
              >
                Back to Case Studies
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-[2rem] border border-white/55 bg-[var(--panel)] p-8 shadow-[0_30px_80px_rgba(59,40,13,0.12)] sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
                  {caseStudy.category}
                </p>
                <p className="text-sm font-medium text-black/58">Case study</p>
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
                {caseStudy.brandName}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-black/66">
                {caseStudy.shortHook}
              </p>
            </section>

            <section className="mt-8 rounded-[1.75rem] border border-[var(--line)] bg-white/82 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Overview
              </p>
              <p className="mt-4 text-base leading-8 text-black/68">
                {caseStudy.overview}
              </p>
            </section>

            <section className="mt-8 space-y-5">
              {caseStudy.sections.map((section) => (
                <article
                  key={section.heading}
                  className="rounded-[1.75rem] border border-[var(--line)] bg-white/82 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)] sm:p-8"
                >
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    {section.heading}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-black/68">
                    {section.body}
                  </p>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
