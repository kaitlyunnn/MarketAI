"use client";

import { type User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { isProUser } from "@/lib/account";
import { getWatchlist } from "@/lib/watchlist";
import { createClient } from "../../utils/supabase/client";

export default function AuthControls() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
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

  async function handleLogout() {
    if (!supabase) {
      setErrorMessage(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
      return;
    }

    setErrorMessage(null);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      setErrorMessage(sessionError.message);
      return;
    }

    if (!sessionData.session) {
      setUser(null);
      startTransition(() => {
        router.refresh();
      });
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setUser(null);
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {user ? (
        <>
          <Link
            href="/watchlist"
            className="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
          >
            Watchlist
            <span className="ml-2 rounded-full bg-[var(--soft)] px-2 py-0.5 text-xs font-semibold text-[var(--ink)]">
              {getWatchlist(user).length}
            </span>
          </Link>
          <div className="hidden rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm text-black/65 shadow-[0_10px_30px_rgba(55,39,16,0.05)] sm:block">
            <span>{user.email}</span>
            {isProUser(user) ? (
              <span className="ml-2 rounded-full border border-amber-300 bg-[linear-gradient(135deg,#f6d365,#f3b54a)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-950 shadow-[0_8px_18px_rgba(224,168,36,0.28)]">
                Pro
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] shadow-[0_10px_30px_rgba(55,39,16,0.08)] transition hover:bg-[var(--soft)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Logging out..." : "Log out"}
          </button>
        </>
      ) : (
        <>
          <Link
            href="/auth?mode=login"
            className="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
          >
            Log in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold !text-white shadow-[0_14px_36px_rgba(27,26,24,0.16)] transition hover:opacity-92 hover:text-white"
          >
            Sign up
          </Link>
        </>
      )}

      {errorMessage ? (
        <p className="hidden max-w-xs rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 shadow-[0_14px_40px_rgba(120,25,25,0.08)] lg:block">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
