import type { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  children: ReactNode;
}

const baseClasses =
  "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 font-sans text-sm font-semibold leading-5 shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55";

const variantClasses = {
  primary:
    "border border-sage bg-sage text-white hover:bg-sage-dark hover:border-sage-dark active:bg-sage-dark",
  secondary:
    "border border-warm-gray bg-cream text-charcoal hover:border-sage-light hover:bg-warm-gray-light active:bg-warm-gray-light",
  danger:
    "border border-rose-200 bg-cream text-rose-700 hover:border-rose-300 hover:bg-rose-50 active:bg-rose-100",
  success:
    "border border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700 active:bg-emerald-800",
} satisfies Record<NonNullable<ButtonProps["variant"]>, string>;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
