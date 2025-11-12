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
