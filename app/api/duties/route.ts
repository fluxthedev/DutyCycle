import { NextRequest, NextResponse } from "next/server";

import {
  DutyLifecycle,
  DutyRecord,
  DutyStatus,
  getDefaultClientId,
  getDutiesForClient
} from "@/lib/duty-store";

interface DutyTimelineEntry {
  id: string;
  dutyId: string;
  dutyTitle: string;
  message: string;
  createdAt: string;
  status: DutyStatus;
  lifecycle: DutyLifecycle;
}

interface DutySummary {
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

function getWeekRange(date: Date): { start: string; end: string } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<DutySummary>> {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") ?? getDefaultClientId();

  const store = getDutiesForClient(clientId);
  const active = store.duties.filter((duty) => duty.lifecycle === "ACTIVE");
  const archived = store.duties.filter((duty) => duty.lifecycle === "ARCHIVED");
  const dutyNameLookup = new Map(store.duties.map((duty) => [duty.id, duty.title]));

  const timeline: DutyTimelineEntry[] = store.logs.slice(0, 25).map((log) => ({
    id: log.id,
    dutyId: log.dutyId,
    dutyTitle: dutyNameLookup.get(log.dutyId) ?? "Unknown duty",
    message: log.message,
    createdAt: log.createdAt,
    status: log.status,
    lifecycle: log.lifecycle
  }));

  const totals = active.reduce(
    (acc, duty) => {
      if (duty.status === "PENDING") {
        acc.pending += 1;
      }
      if (duty.status === "IN_PROGRESS") {
        acc.inProgress += 1;
      }
      if (duty.status === "COMPLETED") {
        acc.completed += 1;
      }
      return acc;
    },
    { pending: 0, inProgress: 0, completed: 0 }
  );

  const response: DutySummary = {
    clientId,
    weekRange: getWeekRange(new Date()),
    active,
    archived,
    timeline,
    totals
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "private, max-age=60"
    }
  });
}
