import { type User } from "@supabase/supabase-js";

import { isProUser } from "./account";

export const FREE_WATCHLIST_LIMIT = 3;
export const PRO_WATCHLIST_LIMIT = 10;

export type WatchlistEntry = {
  slug: string;
  addedAt?: string;
};

function isWatchlistEntry(value: unknown): value is WatchlistEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.slug === "string";
}

export function getWatchlist(user: User | null | undefined): WatchlistEntry[] {
  if (!user) {
    return [];
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const rawWatchlist = metadata?.watchlist;

  if (!Array.isArray(rawWatchlist)) {
    return [];
  }

  return rawWatchlist
    .filter(isWatchlistEntry)
    .map((entry) => ({
      slug: entry.slug,
      addedAt: entry.addedAt,
    }));
}

export function getWatchlistLimit(user: User | null | undefined) {
  if (isProUser(user)) {
    return PRO_WATCHLIST_LIMIT;
  }

  return FREE_WATCHLIST_LIMIT;
}

export function isInWatchlist(
  user: User | null | undefined,
  slug: string,
) {
  return getWatchlist(user).some((entry) => entry.slug === slug);
}

export function addToWatchlist(
  user: User,
  slug: string,
) {
  const current = getWatchlist(user);

  if (current.some((entry) => entry.slug === slug)) {
    return current;
  }

  return [
    ...current,
    {
      slug,
      addedAt: new Date().toISOString(),
    },
  ];
}

export function removeFromWatchlist(
  user: User,
  slug: string,
) {
  return getWatchlist(user).filter((entry) => entry.slug !== slug);
}
