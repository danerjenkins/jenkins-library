import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "../../../../ui/components/Input";
import type { CardSize } from "../../lib/shelfViewPreferences";
import {
  getDensityButtonClasses,
  getDensityGroupClasses,
  getDiscoveryLinkClasses,
  getSegmentedButtonClasses,
  getSegmentedControlClasses,
} from "./shelfBrowseControlStyles";

export function ShelfSearchField({
  id,
  name,
  label,
  value,
  onChange,
  onEnterPress,
  placeholder = "Title or author...",
  className,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onEnterPress?: () => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Input
        id={id}
        name={name}
        label={label}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;

          event.preventDefault();
          onEnterPress?.();
          event.currentTarget.blur();
        }}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="none"
        spellCheck={true}
        inputMode="search"
        enterKeyHint="search"
        className="pl-11! pr-10"
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
    <div
      className={getDensityGroupClasses()}
      role="group"
      aria-label="Shelf density"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={getDensityButtonClasses(value === option.value)}
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
      <div
        className={getSegmentedControlClasses(options.length)}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={getSegmentedButtonClasses(value === option.value)}
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
    <Link to={to} className={getDiscoveryLinkClasses()}>
      <div className="space-y-2">
        <div className={badgeClassName}>{badge}</div>
        <div className="space-y-1">
          <div className="font-display text-2xl font-semibold tracking-tight text-pretty text-stone-900">
            {title}
          </div>
          <p className="max-w-md text-sm leading-relaxed text-stone-600">
            {description}
          </p>
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
