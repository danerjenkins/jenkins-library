import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "success" | "amber";
  children: ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  const variantClasses = {
    default: "bg-stone-100 text-stone-700",
    success: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`font-sans inline-block rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
