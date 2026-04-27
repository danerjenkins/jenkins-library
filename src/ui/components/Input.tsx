interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className, ...props }: InputProps) {
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
      <input id={id} className={`ds-input ${className ?? ""}`} {...props} />
    </div>
  );
}
