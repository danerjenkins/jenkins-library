interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, id, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 ${className || ""}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
