import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "../../../ui/components/Input";
import type { CardSize } from "../shelfViewPreferences";

export const actionLinkClasses =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-sage bg-sage px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage-dark hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";

export const filterFieldGridClasses = "grid gap-3";

const densityGroupClasses =
  "grid grid-cols-4 rounded-lg border border-warm-gray bg-cream p-0.5 shadow-inner shadow-white/50";
const densityButtonClasses =
  "min-h-11 rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const segmentedControlClasses =
  "grid grid-cols-1 gap-1 rounded-lg border border-warm-gray bg-cream p-1 shadow-inner shadow-white/50 sm:grid-cols-3";
const segmentedButtonClasses =
  "min-h-11 rounded-md px-4 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const discoveryLinkClasses =
  "group flex min-h-32 flex-col justify-between rounded-2xl border border-warm-gray/80 bg-cream/95 p-4 text-left no-underline shadow-soft transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-sage/55 hover:bg-parchment/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-0 sm:min-h-36 sm:p-5";

export const ownershipSegmentOptions = [
  { value: "owned", label: "Library Only" },
  { value: "wishlist", label: "Wishlist Only" },
  { value: "all", label: "Library + Wishlist" },
] as const;

export function ShelfSearchField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "Title or author...",
  className,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Input
        id={id}
        name={name}
        label={label}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="!pl-11 pr-10"
      />
      <Search
        className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-stone-400"
        aria-hidden="true"
      />
    </div>
  );
}

export function ShelfDensitySelector({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: CardSize; label: string }>;
  value: CardSize;
  onChange: (value: CardSize) => void;
}) {
  return (
    <div className={densityGroupClasses} role="group" aria-label="Shelf density">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${densityButtonClasses} ${
            value === option.value
              ? "bg-sage text-white shadow-sm"
              : "text-charcoal/70 hover:bg-warm-gray-light hover:text-charcoal"
          }`}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1 sm:col-span-2 lg:col-span-5">
      <legend className="font-sans text-xs font-semibold leading-4 text-stone-700">
        {label}
      </legend>
      <div className={segmentedControlClasses} role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`${segmentedButtonClasses} ${
              value === option.value
                ? "border border-sage bg-sage text-white shadow-sm"
                : "border border-transparent bg-transparent text-charcoal/75 hover:bg-warm-gray-light hover:text-charcoal"
            }`}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function DiscoveryLinkCard({
  to,
  badge,
  badgeClassName,
  title,
  description,
  summary,
  cta,
  ctaClassName,
}: {
  to: string;
  badge: string;
  badgeClassName: string;
  title: string;
  description: string;
  summary: string;
  cta: string;
  ctaClassName: string;
}) {
  return (
    <Link to={to} className={discoveryLinkClasses}>
      <div className="space-y-2">
        <div className={badgeClassName}>{badge}</div>
        <div className="space-y-1">
          <div className="font-display text-2xl font-semibold tracking-tight text-pretty text-stone-900">
            {title}
          </div>
          <p className="max-w-md text-sm leading-relaxed text-stone-600">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-stone-600">{summary}</span>
        <span
          className={`font-semibold transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 ${ctaClassName}`}
        >
          {cta}
        </span>
      </div>
    </Link>
  );
}
