import type { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const baseClasses =
    "px-4 py-2 text-sm font-semibold rounded-md shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses = {
    primary: "bg-stone-900 text-white hover:bg-stone-800",
    secondary: "border border-stone-300 text-stone-700 hover:bg-stone-50",
    danger: "border border-rose-200 text-rose-600 hover:bg-rose-50",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className || ""}`}
      {...props}
    />
  );
}
