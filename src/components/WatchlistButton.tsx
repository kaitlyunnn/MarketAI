"use client";

import { type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  addToWatchlist,
  FREE_WATCHLIST_LIMIT,
  getWatchlist,
  getWatchlistLimit,
  removeFromWatchlist,
} from "@/lib/watchlist";
import { createClient } from "../../utils/supabase/client";

type WatchlistButtonProps = {
  productSlug: string;
};

export default function WatchlistButton({
  productSlug,
}: WatchlistButtonProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const watchlist = useMemo(() => getWatchlist(user), [user]);
  const limit = useMemo(() => getWatchlistLimit(user), [user]);
  const isSaved = watchlist.some((entry) => entry.slug === productSlug);

  async function handleToggleWatchlist() {
    if (!supabase) {
      setMessage(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const activeUser = sessionData.session?.user ?? null;

      if (!activeUser) {
        router.push("/auth?mode=login");
        return;
      }

      const nextWatchlist = isSaved
        ? removeFromWatchlist(activeUser, productSlug)
        : addToWatchlist(activeUser, productSlug);

      if (!isSaved && nextWatchlist.length > getWatchlistLimit(activeUser)) {
        throw new Error(
          `Free plans can save up to ${FREE_WATCHLIST_LIMIT} products. Pro plans will support larger watchlists.`,
        );
      }

      const { data: updatedUserData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            ...activeUser.user_metadata,
            watchlist: nextWatchlist,
          },
        });

      if (updateError) {
        throw updateError;
      }

      setUser(updatedUserData.user);
      setMessage(
        isSaved
          ? "Removed from your watchlist."
          : "Saved to your watchlist.",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update watchlist.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5 text-sm text-black/60">
        Loading watchlist options...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5">
        <p className="text-sm leading-6 text-black/62">
          Log in to save this product to your watchlist.
        </p>
        <button
          type="button"
          onClick={() => router.push("/auth?mode=login")}
          className="mt-4 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Log in to save
        </button>
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-5 shadow-[0_18px_50px_rgba(49,33,10,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Watchlist
          </p>
          <p className="mt-2 text-sm leading-6 text-black/62">
            {isSaved
              ? "This product is already saved to your watchlist."
              : `Save this product for later. You can save up to ${limit} products on your current plan.`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleWatchlist}
          disabled={isSaving}
          className={`rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isSaved
              ? "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--soft)]"
              : "bg-[var(--ink)] text-white hover:opacity-90"
          }`}
        >
          {isSaving
            ? isSaved
              ? "Removing..."
              : "Saving..."
            : isSaved
              ? "Remove from watchlist"
              : "Add to watchlist"}
        </button>
      </div>
      {message ? (
        <p className="mt-4 text-sm leading-6 text-black/68">{message}</p>
      ) : null}
    </section>
  );
}
