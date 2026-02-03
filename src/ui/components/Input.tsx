interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="font-sans text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`font-sans rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 ${className || ""}`}
        {...props}
      />
    </div>
  );
}
