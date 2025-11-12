import type { DutyLifecycle, DutyRecord, DutyStatus } from "@/models/duty";

export interface DutyTimelineEntry {
  id: string;
  dutyId: string;
  dutyTitle: string;
  message: string;
  createdAt: string;
  status: DutyStatus;
  lifecycle: DutyLifecycle;
}

export interface DutySummary {
  clientId: string;
  weekRange: { start: string; end: string };
  active: DutyRecord[];
  archived: DutyRecord[];
  timeline: DutyTimelineEntry[];
  totals: {
    pending: number;
    inProgress: number;
    completed: number;
  };
}
