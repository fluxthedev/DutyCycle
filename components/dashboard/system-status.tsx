"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { SystemStatusProps, SystemStatusResponse } from "@/models/dashboard";

async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  // In production this would call a remote API. We simulate latency for demo purposes.
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    status: "operational",
    updatedAt: new Date().toISOString()
  };
}

export function SystemStatus({ className }: SystemStatusProps = {}): JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    staleTime: 60_000
  });

  return (
    <Card className={cn("lg:col-span-2", className)}>
      <CardHeader>
        <CardTitle>Platform status</CardTitle>
        <CardDescription>Real-time health of the DutyCycle platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <p className="text-muted-foreground">Loading current status…</p>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-semibold capitalize">{data.status}</p>
            <p className="text-xs text-muted-foreground">Updated {new Date(data.updatedAt).toLocaleTimeString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
