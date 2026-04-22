interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const inputClasses =
  "w-full rounded-md border border-warm-gray bg-cream px-2.5 py-1.5 font-sans text-sm leading-5 text-stone-900 shadow-sm transition-[border-color,box-shadow,background-color] duration-150 ease-out placeholder:text-stone-400 hover:border-sage-light focus:border-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/25 disabled:cursor-not-allowed disabled:bg-warm-gray-light disabled:text-stone-500 disabled:shadow-none";

export function Input({ label, id, className, ...props }: InputProps) {
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
      <input
        id={id}
        className={`${inputClasses} ${className ?? ""}`}
        {...props}
      />
    </div>
  );
}
