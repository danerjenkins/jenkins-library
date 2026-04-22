interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const inputClasses =
  "w-full rounded-md border border-warm-gray bg-cream px-3 py-2 font-sans text-sm leading-5 text-stone-900 shadow-sm transition-[border-color,box-shadow,background-color] duration-150 ease-out placeholder:text-stone-400 hover:border-sage-light focus:border-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/25 disabled:cursor-not-allowed disabled:bg-warm-gray-light disabled:text-stone-500 disabled:shadow-none";

export function Input({ label, id, className, ...props }: InputProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="font-sans text-sm font-medium leading-5 text-stone-700"
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
