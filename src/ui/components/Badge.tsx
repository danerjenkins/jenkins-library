import type { ReactNode } from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "amber";
  children: ReactNode;
}

const variantClasses = {
  default: "ds-badge--default",
  success: "ds-badge--success",
  amber: "ds-badge--amber",
} satisfies Record<NonNullable<BadgeProps["variant"]>, string>;

export function Badge({
  variant = "default",
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`ds-badge ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
