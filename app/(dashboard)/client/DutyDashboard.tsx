// app/(dashboard)/client/DutyDashboard.tsx
"use client";

import { useCallback, useMemo, useState, useQuery} from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DutyLifecycle, DutyRecord, DutyStatus } from "@/lib/duty-store";
// ...other imports used by the component...

interface DutyDashboardProps {
  clientId: string;
}

export default function DutyDashboard({ clientId }: DutyDashboardProps): JSX.Element {
  const queryClient = useQueryClient();
  const [view, setView] = useState<DutyLifecycle>("ACTIVE");

  const { data, isLoading, isRefetching, isError, error } = useQuery({
    queryKey: ["duties", clientId],
    queryFn: () => fetchDuties(clientId)
  });

  const mutation = useMutation({
    mutationFn: submitCompletion,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["duties", clientId] });
    }
  });

  const duties = useMemo(() => {
    if (!data) {
      return [];
    }
    return view === "ACTIVE" ? data.active : data.archived;
  }, [data, view]);

  const totals = data?.totals ?? { pending: 0, inProgress: 0, completed: 0 };
  const weekLabel = data ? `${dateFormatter.format(new Date(data.weekRange.start))} – ${dateFormatter.format(new Date(data.weekRange.end))}` : "";

  const handleSubmit = useCallback(
    async (payload: CompletionPayload) => {
      await mutation.mutateAsync(payload);
    },
    [mutation]
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-2 rounded-xl border bg-card/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Client duty tracker</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {isLoading ? "Loading week overview..." : `Week of ${weekLabel}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-md bg-muted px-3 py-1 font-medium">Pending: {totals.pending}</span>
          <span className="rounded-md bg-muted px-3 py-1 font-medium">In progress: {totals.inProgress}</span>
          <span className="rounded-md bg-muted px-3 py-1 font-medium">Completed: {totals.completed}</span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={view === "ACTIVE" ? "default" : "outline"}
              onClick={() => setView("ACTIVE")}
              aria-pressed={view === "ACTIVE"}
            >
              Active duties
            </Button>
            <Button
              type="button"
              variant={view === "ARCHIVED" ? "default" : "outline"}
              onClick={() => setView("ARCHIVED")}
              aria-pressed={view === "ARCHIVED"}
            >
              Archived duties
            </Button>
            <Button type="button" variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ["duties", clientId] })}>
              Refresh data
            </Button>
          </div>

          <Card className="bg-background/80">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{view === "ACTIVE" ? "Current week" : "Archive"}</CardTitle>
              <CardDescription>
                {view === "ACTIVE"
                  ? "Review duties scheduled for this week and submit completion evidence."
                  : "Previously closed duties remain accessible for audit trails."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading || isRefetching ? (
                <p className="text-sm text-muted-foreground">Syncing duties…</p>
              ) : null}
              {isError ? <p className="text-sm text-red-500">{(error as Error)?.message ?? "Unknown error"}</p> : null}
              {!isLoading && duties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No duties to display.</p>
              ) : null}
              <div className="space-y-4">
                {duties.map((duty) => (
                  <DutyCard
                    key={duty.id}
                    duty={duty}
                    clientId={clientId}
                    lifecycle={view}
                    onSubmit={handleSubmit}
                    isMutating={mutation.isPending}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="bg-background/80">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Download duty history</CardTitle>
              <CardDescription>Export a filtered audit log for offline review.</CardDescription>
            </CardHeader>
            <CardContent>
              <DownloadControls clientId={clientId} lifecycle={view} />
            </CardContent>
          </Card>

          <Card className="bg-background/80">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent activity</CardTitle>
              <CardDescription>Latest duty events across the portfolio.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {data?.timeline.length ? (
                  data.timeline.map((item) => (
                    <li key={item.id} className="flex flex-col gap-1 rounded-md border border-dashed border-muted/60 p-3">
                      <span className="font-medium text-foreground">{item.dutyTitle}</span>
                      <span>{item.message}</span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground/80">
                        {timeFormatter.format(new Date(item.createdAt))} · {item.status} · {item.lifecycle}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>No recent events logged.</li>
                )}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
