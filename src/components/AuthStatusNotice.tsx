"use client";

import { useSearchParams } from "next/navigation";

export default function AuthStatusNotice() {
  const searchParams = useSearchParams();
  const authState = searchParams.get("auth");

  if (authState === "check-email") {
    return (
      <section className="mt-8 rounded-[1.75rem] border border-[var(--line)] bg-white/80 p-5 text-[var(--ink)] shadow-[0_12px_40px_rgba(55,39,16,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Account created
        </p>
        <p className="mt-2 text-sm leading-6 text-black/68">
          Check your email to confirm your account, then log in from the navbar.
        </p>
      </section>
    );
  }

  return null;
}
