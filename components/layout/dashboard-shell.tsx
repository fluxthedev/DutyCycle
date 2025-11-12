import { cn } from "@/lib/utils";

import type { DashboardShellProps } from "@/models/layout";

export function DashboardShell({ children, className }: DashboardShellProps): JSX.Element {
  return <section className={cn("grid gap-6", className)}>{children}</section>;
}
