import { LoaderCircle } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import "./LoadingState.css";

type LoadingStateVariant = "panel" | "shelf" | "detail";

interface LoadingStateProps {
  title: string;
  description?: string;
  variant?: LoadingStateVariant;
  className?: string;
  cardCount?: number;
  children?: ReactNode;
}

function LoadingLine({
  className = "",
  width,
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div
      className={`loading-state__line ${className}`}
      style={width ? ({ width } as CSSProperties) : undefined}
      aria-hidden="true"
    />
  );
}

function LoadingShelfCard({ index }: { index: number }) {
  return (
    <article className="loading-state__card" style={{ "--loading-delay": `${index * 90}ms` } as CSSProperties}>
      <div className="loading-state__cover" aria-hidden="true" />
      <div className="loading-state__card-body">
        <LoadingLine className="loading-state__line--title" width="78%" />
        <LoadingLine width="56%" />
        <LoadingLine width="64%" />
      </div>
    </article>
  );
}

export function LoadingState({
  title,
  description,
  variant = "panel",
  className = "",
  cardCount = 6,
  children,
}: LoadingStateProps) {
  return (
    <section
      className={`loading-state loading-state--${variant} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={title}
    >
      <div className="loading-state__ambient" aria-hidden="true" />
      <div className="loading-state__header">
        <span className="loading-state__badge">
          <LoaderCircle className="loading-state__spinner" aria-hidden="true" size={16} />
          <span>{title}</span>
        </span>
        {description ? <p className="loading-state__description">{description}</p> : null}
      </div>

      {variant === "detail" ? (
        <div className="loading-state__detail">
          <div className="loading-state__detail-cover" aria-hidden="true" />
          <div className="loading-state__detail-copy">
            <LoadingLine className="loading-state__line--title" width="42%" />
            <LoadingLine width="78%" />
            <LoadingLine width="64%" />
            <LoadingLine width="88%" />
            <div className="loading-state__detail-metrics">
              <span className="loading-state__pill" aria-hidden="true" />
              <span className="loading-state__pill" aria-hidden="true" />
              <span className="loading-state__pill" aria-hidden="true" />
            </div>
          </div>
        </div>
      ) : variant === "shelf" ? (
        <div className="loading-state__shelf-grid">
          {Array.from({ length: cardCount }).map((_, index) => (
            <LoadingShelfCard key={index} index={index} />
          ))}
        </div>
      ) : (
        <div className="loading-state__panel">
          <div className="loading-state__panel-chart" aria-hidden="true">
            <span className="loading-state__panel-bar loading-state__panel-bar--tall" />
            <span className="loading-state__panel-bar loading-state__panel-bar--mid" />
            <span className="loading-state__panel-bar loading-state__panel-bar--short" />
          </div>
          <div className="loading-state__panel-copy">
            <LoadingLine className="loading-state__line--title" width="66%" />
            <LoadingLine width="86%" />
            <LoadingLine width="74%" />
          </div>
        </div>
      )}

      {children ? <div className="loading-state__footer">{children}</div> : null}
    </section>
  );
}
