import type { PropsWithChildren } from "react";

export interface PageHeaderProps extends PropsWithChildren {
  description?: string;
  className?: string;
}

export interface DashboardShellProps extends PropsWithChildren {
  className?: string;
}
