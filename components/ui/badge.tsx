import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "outline";
};

const variantClassNames: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  success: "border-transparent bg-green-100 text-green-800",
  warning: "border-transparent bg-amber-100 text-amber-900",
  outline: "border-border bg-transparent text-foreground"
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      variantClassNames[variant],
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
