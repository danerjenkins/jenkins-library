import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "success" | "amber";
  children: ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  const variantClasses = {
    default: "bg-warm-gray-light text-charcoal",
    success: "bg-emerald-100 text-emerald-700",
    amber: "bg-brass/20 text-wood",
  };

  return (
    <span
      className={`font-sans inline-block rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
