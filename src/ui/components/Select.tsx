interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

const selectClasses =
  "w-full appearance-none rounded-md border border-warm-gray bg-cream py-1.5 pl-2.5 pr-8 font-sans text-sm leading-5 text-stone-900 shadow-sm transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-sage-light focus:border-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/25 disabled:cursor-not-allowed disabled:bg-warm-gray-light disabled:text-stone-500 disabled:shadow-none";

export function Select({
  label,
  id,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="font-sans text-xs font-semibold leading-4 text-stone-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`${selectClasses} ${className ?? ""}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-stone-500"
        />
      </div>
    </div>
  );
}
