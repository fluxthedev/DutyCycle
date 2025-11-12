// app/(dashboard)/client/DutyDashboard.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, CheckCircle2, CloudDownload, FileText, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DutyLifecycle, DutyStatus } from "@/models/duty";
import type { DutyCompletionPayload } from "@/models/duty-events";
import type { DutyCardProps, DutyDashboardProps, DownloadControlsProps, DutiesQueryResult } from "@/models/dashboard";

async function downloadDutyLogs(clientId: string, lifecycle: DutyLifecycle, format: "csv" | "json"): Promise<void> {
  const url = new URL(`/api/duty-logs`, window.location.origin);
  url.searchParams.set("clientId", clientId);
  url.searchParams.set("lifecycle", lifecycle);
  url.searchParams.set("format", format);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Unable to download logs");
  }

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `duty-logs-${clientId}-${lifecycle}.${format}`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href)
    ;
}

function DownloadControls({ clientId, lifecycle }: DownloadControlsProps): JSX.Element {
  const [busy, setBusy] = useState(false);
  const handleDownload = useCallback(
    async (format: "csv" | "json") => {
      try {
        setBusy(true);
        await downloadDutyLogs(clientId, lifecycle, format);
      } finally {
        setBusy(false);
      }
    },
    [clientId, lifecycle]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={busy} onClick={() => void handleDownload("json")}>
        <CloudDownload className="mr-2 h-4 w-4" /> Download JSON
      </Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => void handleDownload("csv")}>
        <ArrowDownToLine className="mr-2 h-4 w-4" /> Download CSV
      </Button>
    </div>
  );
}

function DutyCard({ duty, clientId, lifecycle, onSubmit, isMutating }: DutyCardProps): JSX.Element {
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isCompleted = duty.status === "COMPLETED";
  const nextStatus: DutyStatus = isCompleted ? "PENDING" : "COMPLETED";

  const hasAttachmentRequirement = duty.requiresAttachment && !isCompleted;
  const hasNotesRequirement = duty.notesRequired && !isCompleted;
  const canSubmit =
    (!hasAttachmentRequirement || Boolean(attachment)) && (!hasNotesRequirement || notes.trim().length > 0);

  const handleSubmit = async (): Promise<void> => {
    const nextLifecycle: DutyLifecycle = nextStatus === "COMPLETED" ? "ARCHIVED" : "ACTIVE";

    await onSubmit({
      dutyId: duty.id,
      status: nextStatus,
      clientId,
      lifecycle: nextLifecycle,
      notes: notes.trim().length > 0 ? notes.trim() : undefined,
      attachment: isCompleted ? null : attachment
    });
    if (!isCompleted) {
      setNotes("");
      setAttachment(null);
      setExpanded(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-balance sm:text-xl">{duty.title}</CardTitle>
          <CardDescription className="mt-1 text-sm sm:text-base">{duty.description}</CardDescription>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {duty.frequency}
          </span>
          <span
            className={`inline-flex items-center gap-2 text-sm font-medium ${
              isCompleted ? "text-emerald-600" : duty.status === "IN_PROGRESS" ? "text-amber-600" : "text-slate-700"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {duty.status.replace(/_/g, " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>Due {dateFormatter.format(new Date(duty.dueDate))}</span>
          <span className="hidden sm:inline" aria-hidden>
            •
          </span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground/80">{lifecycle} duty</span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isCompleted ? "outline" : "default"}
              disabled={isMutating || (!isCompleted && !canSubmit)}
              onClick={() => void handleSubmit()}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isCompleted ? "Reopen duty" : "Mark complete"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              <FileText className="mr-2 h-4 w-4" />
              {expanded ? "Hide notes" : "Add notes or proof"}
            </Button>
          </div>
          {expanded ? (
            <div className="grid gap-3 rounded-lg border border-dashed border-muted bg-muted/30 p-3 text-sm sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes {hasNotesRequirement ? <span className="text-red-500">(required)</span> : null}
                <textarea
                  className="mt-1 min-h-[80px] rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add context or remediation notes"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence upload {hasAttachmentRequirement ? <span className="text-red-500">(required)</span> : null}
                <input
                  type="file"
                  className="mt-1 cursor-pointer rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setAttachment(file ?? null);
                  }}
                  aria-label={`Upload evidence for ${duty.title}`}
                />
                {attachment ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {attachment.name}
                  </span>
                ) : null}
              </label>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

async function submitCompletion(payload: DutyCompletionPayload): Promise<void> {
  const ensureOk = async (response: Response): Promise<void> => {
    if (!response.ok) {
      const message = await response
        .json()
        .catch(() => ({ error: "Unable to update duty" }));
      throw new Error(message.error ?? "Unable to update duty");
    }
  };

  if (payload.attachment) {
    const formData = new FormData();
    formData.append("dutyId", payload.dutyId);
    formData.append("status", payload.status);
    formData.append("clientId", payload.clientId);
    formData.append("lifecycle", payload.lifecycle);
    if (payload.notes) {
      formData.append("notes", payload.notes);
    }
    formData.append("attachment", payload.attachment);

    const response = await fetch("/api/duty-events", {
      method: "POST",
      body: formData
    });
    await ensureOk(response);
    return;
  }

  const response = await fetch("/api/duty-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      dutyId: payload.dutyId,
      status: payload.status,
      clientId: payload.clientId,
      lifecycle: payload.lifecycle,
      notes: payload.notes ?? undefined
    })
  });
  await ensureOk(response);
}

export default function DutyDashboard({ clientId }: DutyDashboardProps): JSX.Element {
  const queryClient = useQueryClient();
  const [view, setView] = useState<DutyLifecycle>("ACTIVE");

  const { data, isLoading, isRefetching, isError, error } = useQuery({
    queryKey: ["duties", clientId],
    queryFn: () => fetchDuties(clientId)
  });

  async function fetchDuties(clientId: string): Promise<DutiesQueryResult> {
    const response = await fetch(`/api/duties?clientId=${clientId}`, {
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Unable to load duties");
    }

    const payload = (await response.json()) as DutiesQueryResult;
    return payload;
  }
  
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
    async (payload: DutyCompletionPayload) => {
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
