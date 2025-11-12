import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}
