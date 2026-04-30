import Image from "next/image";
import Link from "next/link";

import AuthControls from "./AuthControls";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/6 bg-[rgba(252,248,241,0.84)] backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="overflow-hidden rounded-xl shadow-[0_12px_24px_rgba(27,26,24,0.18)]">
              <Image
                src="/marketai-logo.png"
                alt="MarketAI logo"
                width={44}
                height={44}
                className="h-11 w-11 object-cover"
                priority
              />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                MarketAI
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Product research
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/case-studies"
              className="rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
            >
              Case Studies
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/case-studies"
            className="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
          >
            Case Studies
          </Link>
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
