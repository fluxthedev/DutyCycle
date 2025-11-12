"use client";

import { useCallback, useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, CheckCircle2, CloudDownload, FileText, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DutyDashboard from "./DutyDashboard";
import type { DutyLifecycle, DutyRecord, DutyStatus } from "@/lib/duty-store";

interface DutyCardProps {
  duty: DutyRecord;
  clientId: string;
  lifecycle: DutyLifecycle;
  onSubmit: (payload: CompletionPayload) => Promise<void>;
  isMutating: boolean;
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

interface DownloadControlsProps {
  clientId: string;
  lifecycle: DutyLifecycle;
}

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
  URL.revokeObjectURL(link.href);
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

interface DutyDashboardProps {
  clientId: string;
}

export default function ClientPage(): JSX.Element {
  const defaultClient = "acme-co";
  return <DutyDashboard clientId={defaultClient} />;
}
