import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps extends PropsWithChildren {
  description?: string;
  className?: string;
}

export function PageHeader({ children, description, className }: PageHeaderProps): JSX.Element {
  return (
    <div className={cn("space-y-2", className)}>
      <h1 className="text-3xl font-semibold tracking-tight">{children}</h1>
      {description ? <p className="text-muted-foreground">{description}</p> : null}
    </div>
  );
}
