import Link from "next/link";
import { cookies } from "next/headers";

import AppHeader from "@/components/AppHeader";
import { getUserPlan } from "@/lib/account";
import { canAccessCaseStudy } from "@/lib/caseStudies";
import { caseStudies } from "@/data/caseStudies";
import { createClient } from "../../../utils/supabase/server";

export default async function CaseStudiesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const sessionResult = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null }, error: null };
  const activeUser = sessionResult.data.session?.user ?? null;
  const plan = getUserPlan(activeUser);
  const upgradeHref = activeUser ? "/" : "/auth?mode=signup";

  return (
    <main className="min-h-screen">
      <AppHeader />

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-6 sm:px-10 lg:px-12">
        <section className="rounded-[2rem] border border-white/55 bg-[var(--panel)] p-8 shadow-[0_30px_80px_rgba(59,40,13,0.12)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            Case Studies
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Successful ecommerce brand breakdowns
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/65 sm:text-lg">
            Learn from in-depth breakdowns of successful ecommerce brands. Each case study analyzes the unique strategies and tactics that drove growth, with actionable takeaways you can apply to your own business.
          </p>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {caseStudies.map((caseStudy, index) => {
            const hasAccess = canAccessCaseStudy(index, plan);

            return (
              <article
                key={caseStudy.slug}
                className={`relative flex min-h-[24rem] h-full flex-col rounded-[1.75rem] border border-[var(--line)] bg-white/82 p-6 shadow-[0_22px_60px_rgba(49,33,10,0.08)] transition ${
                  hasAccess ? "" : "overflow-hidden"
                }`}
              >
                <div
                  className={`flex flex-1 flex-col ${hasAccess ? "" : "pointer-events-none select-none blur-[2px] opacity-60"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
                      {caseStudy.category}
                    </p>
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    {caseStudy.brandName}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-black/62 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden">
                    {caseStudy.shortHook}
                  </p>
                  <p className="mt-5 text-sm leading-7 text-black/58 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:5] overflow-hidden">
                    {caseStudy.overview}
                  </p>
                </div>

                {hasAccess ? (
                  <div className="mt-6 pt-2">
                    <Link
                      href={`/case-studies/${caseStudy.slug}`}
                      className="inline-flex items-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold !text-white transition hover:opacity-90"
                    >
                      Read Case Study
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(248,243,234,0.18),rgba(248,243,234,0.72))]" />
                    <div className="absolute right-5 top-5 rounded-full border border-amber-300 bg-[linear-gradient(135deg,#f6d365,#f3b54a)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-950 shadow-[0_10px_18px_rgba(224,168,36,0.24)]">
                      Pro
                    </div>
                    <div className="relative mt-6 pt-2">
                      <Link
                        href={upgradeHref}
                        className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--soft)]"
                      >
                        Unlock with Pro
                      </Link>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
