import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

interface PageHeroProps {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

const pageLayoutClasses = "mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-10";
const pageHeroClasses =
  "rounded-[1.75rem] border border-warm-gray/85 bg-cream/95 p-5 shadow-soft backdrop-blur-sm sm:p-7";
const pageSectionClasses =
  "rounded-[1.5rem] border border-warm-gray/80 bg-cream/90 p-4 shadow-soft sm:p-6";

export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={`${pageLayoutClasses} ${className ?? ""}`}>{children}</div>;
}

export function PageHero({
  title,
  description,
  meta,
  actions,
  children,
  className,
}: PageHeroProps) {
  return (
    <section className={`${pageHeroClasses} ${className ?? ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="font-display text-3xl font-bold tracking-tight text-pretty text-stone-900 sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <div className="font-sans max-w-3xl text-base leading-relaxed text-stone-600">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {meta ? (
        <div className="mt-6 text-sm text-stone-600" aria-live="polite">
          {meta}
        </div>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export function PageSection({ children, className }: PageSectionProps) {
  return <section className={`${pageSectionClasses} ${className ?? ""}`}>{children}</section>;
}
