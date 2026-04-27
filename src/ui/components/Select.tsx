interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  id,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="ds-field">
      {label && (
        <label
          htmlFor={id}
          className="ds-field__label"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select id={id} className={`ds-select ${className ?? ""}`} {...props}>
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
