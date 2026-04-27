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

export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={`ds-page-layout ${className ?? ""}`}>{children}</div>;
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
    <section className={`ds-page-hero ${className ?? ""}`}>
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
  return <section className={`ds-page-section ${className ?? ""}`}>{children}</section>;
}
