import { useEffect, useState, type ReactNode } from "react";
import type { LibraryHeroQuote } from "../libraryHeroQuotes";

interface LibraryHeroProps {
  title: string;
  quotes: LibraryHeroQuote[];
  totalCount: number;
  ownedCount: number;
  wishlistCount: number;
  children: ReactNode;
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c6a8] bg-[linear-gradient(180deg,rgba(246,238,224,0.9),rgba(231,219,199,0.88))] px-3 py-1.5 text-[#3f3125] shadow-[0_8px_18px_rgba(36,24,18,0.14)]">
      <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#7a6045]">
        {label}
      </span>
      <span className="font-display text-base font-semibold text-[#3a2a1c] sm:text-lg">
        {value}
      </span>
    </div>
  );
}

export function LibraryHero({
  title,
  quotes,
  totalCount,
  ownedCount,
  wishlistCount,
  children,
}: LibraryHeroProps) {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(() => {
    if (quotes.length === 0) {
      return 0;
    }

    return Math.floor(Math.random() * quotes.length);
  });

  useEffect(() => {
    if (quotes.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveQuoteIndex((currentIndex) => {
        let nextIndex = currentIndex;

        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * quotes.length);
        }

        return nextIndex;
      });
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [quotes]);

  const activeQuote = quotes[activeQuoteIndex] ?? null;

  return (
    <section className="relative w-full overflow-hidden bg-parchment text-cream shadow-soft-md">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/heroimg.png')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(36,36,36,0.76)_0%,rgba(36,36,36,0.44)_48%,rgba(36,36,36,0.24)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,247,239,0.08)_0%,rgba(36,36,36,0.12)_45%,rgba(36,36,36,0.64)_100%)]"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mx-auto flex min-h-[17rem] w-full max-w-6xl flex-col justify-end px-4 pb-5 pt-16 sm:min-h-[19rem] sm:px-6 sm:pb-6 sm:pt-18">
          <div className="max-w-3xl space-y-3">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold tracking-tight text-pretty text-cream [text-shadow:0_3px_18px_rgba(0,0,0,0.7)] sm:text-5xl">
                {title}
              </h1>
              {activeQuote ? (
                <div className="relative max-w-3xl overflow-hidden rounded-[0.95rem] border border-[#cdb79a] bg-[linear-gradient(180deg,rgba(246,238,224,0.96),rgba(235,223,203,0.94))] px-5 py-4 text-[#34281f] shadow-[0_14px_30px_rgba(38,26,18,0.16)] min-h-[10.5rem] sm:min-h-[11rem] sm:px-6">
                  <div
                    className="pointer-events-none absolute inset-[0.45rem] rounded-[0.7rem] border border-[#e8d8bf]/80"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute left-4 top-3 font-display text-5xl leading-none text-[#b88a45]/40 sm:text-6xl"
                    aria-hidden="true"
                  >
                    “
                  </div>
                  <div
                    key={`${activeQuote.source}-${activeQuoteIndex}`}
                    className="relative z-10 flex min-h-[8.75rem] flex-col justify-center pl-7 pr-1 motion-safe:animate-[library-hero-quote-in_900ms_cubic-bezier(0.22,1,0.36,1)] sm:min-h-[9.25rem] sm:pl-8"
                  >
                    <p className="max-w-none pr-2 font-display text-lg italic leading-relaxed text-[#34281f] sm:text-[1.45rem]">
                      {activeQuote.text}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6c5742] sm:text-[0.95rem]">
                      <span className="font-sans uppercase tracking-[0.16em] text-[#7b6043]">
                        {activeQuote.source}
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-px w-5 bg-[#b88a45]/55"
                      >
                        
                      </span>
                      <span className="font-display italic text-[#4a3b2d]">
                        {activeQuote.author}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <HeroStat label="Books Tracked" value={String(totalCount)} />
            <HeroStat label="Owned" value={String(ownedCount)} />
            <HeroStat label="Wishlist" value={String(wishlistCount)} />
          </div>

          <div className="mt-3 text-cream">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
