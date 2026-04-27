import type { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  children: ReactNode;
}

const variantClasses = {
  primary: "ds-button--primary",
  secondary: "ds-button--secondary",
  danger: "ds-button--danger",
  success: "ds-button--success",
} satisfies Record<NonNullable<ButtonProps["variant"]>, string>;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`ds-button ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
