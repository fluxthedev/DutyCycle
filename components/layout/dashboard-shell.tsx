import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface DashboardShellProps extends PropsWithChildren {
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps): JSX.Element {
  return <section className={cn("grid gap-6", className)}>{children}</section>;
}
