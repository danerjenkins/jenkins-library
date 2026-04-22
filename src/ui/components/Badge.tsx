import type { ReactNode } from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "amber";
  children: ReactNode;
}

const baseClasses =
  "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 font-sans text-xs font-medium leading-4";

const variantClasses = {
  default: "border-warm-gray bg-warm-gray-light text-charcoal",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-brass/30 bg-brass/15 text-wood",
} satisfies Record<NonNullable<BadgeProps["variant"]>, string>;

export function Badge({
  variant = "default",
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
