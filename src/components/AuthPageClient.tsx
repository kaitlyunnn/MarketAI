"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import AppHeader from "./AppHeader";
import { createClient } from "../../utils/supabase/client";

type AuthMode = "login" | "signup";

export default function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mode = useMemo<AuthMode>(() => {
    return searchParams.get("mode") === "signup" ? "signup" : "login";
  }, [searchParams]);
  const authReason = searchParams.get("reason");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setErrorMessage(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (sessionData.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      const authResponse =
        mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  plan: "free",
                  watchlist: [],
                },
              },
            })
          : await supabase.auth.signInWithPassword({
              email,
              password,
            });

      if (authResponse.error) {
        throw authResponse.error;
      }

      if (mode === "signup" && !authResponse.data.session) {
        router.replace("/?auth=check-email");
        router.refresh();
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const alternateHref =
    mode === "signup" ? "/auth?mode=login" : "/auth?mode=signup";

  return (
    <main className="min-h-screen">
      <AppHeader />

      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-6 py-10 sm:px-10 lg:px-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-black/70">
              {mode === "signup"
                ? "Create your MarketAI account"
                : "Access your MarketAI workspace"}
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
                {mode === "signup"
                  ? "Start tracking better product opportunities."
                  : "Pick up right where you left off."}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-black/65">
                {mode === "signup"
                  ? "Create an account with email and password, then return straight to the dashboard."
                  : "Log in with your email and password to get back to the MarketAI home page."}
              </p>
            </div>
          </div>

          <section className="rounded-[2rem] border border-white/55 bg-[var(--panel)] p-6 shadow-[0_30px_90px_rgba(19,18,17,0.14)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              {mode === "signup" ? "New account" : "Welcome back"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              {mode === "signup" ? "Sign up" : "Log in"}
            </h2>

            {authReason === "pro-purchase" ? (
              <div className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                You need to sign up or log in before purchasing the MarketAI Pro
                plan.
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block rounded-[1.25rem] border border-[var(--line)] bg-white/85 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
                />
              </label>

              <label className="block rounded-[1.25rem] border border-[var(--line)] bg-white/85 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder="Minimum 6 characters"
                  className="mt-2 w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
                />
              </label>

              {errorMessage ? (
                <p className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? mode === "signup"
                    ? "Creating account..."
                    : "Logging in..."
                  : mode === "signup"
                    ? "Create account"
                    : "Log in"}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-black/60">
              <span>
                {mode === "signup"
                  ? "Already have an account?"
                  : "Need an account?"}
              </span>
              <Link
                href={alternateHref}
                className="font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4"
              >
                {mode === "signup" ? "Log in" : "Sign up"}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
