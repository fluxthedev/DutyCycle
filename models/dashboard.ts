import type { KPI } from "@/lib/schemas/dashboard";
import type { DutyCompletionPayload } from "@/models/duty-events";
import type { DutyLifecycle, DutyRecord } from "@/models/duty";
import type { DutySummary } from "@/models/duty-summary";

export interface DutyDashboardProps {
  clientId: string;
}

export interface DownloadControlsProps {
  clientId: string;
  lifecycle: DutyLifecycle;
}

export interface DutyCardProps {
  duty: DutyRecord;
  clientId: string;
  lifecycle: DutyLifecycle;
  onSubmit: (payload: DutyCompletionPayload) => Promise<void>;
  isMutating: boolean;
}

export type DutiesQueryResult = DutySummary;

export interface SystemStatusResponse {
  status: "operational" | "degraded" | "outage";
  updatedAt: string;
}

export interface SystemStatusProps {
  className?: string;
}

export interface KPIGridProps {
  items: KPI[];
}
