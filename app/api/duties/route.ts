import { DutyFrequency, DutyStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDutiesTableData, toDutyRow } from "@/app/(dashboard)/manager/actions";
import { prisma } from "@/lib/prisma";

const createDutySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  clientId: z.coerce.number(),
  frequency: z.nativeEnum(DutyFrequency).default(DutyFrequency.ONCE),
  assignedToId: z.coerce.number().nullable().optional()
});

export async function GET(): Promise<NextResponse> {
  const duties = await getDutiesTableData();
  return NextResponse.json(duties);
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json();
  const parsed = createDutySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const duty = await prisma.duty.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      clientId: parsed.data.clientId,
      frequency: parsed.data.frequency,
      assignedToId: parsed.data.assignedToId ?? null
    }
  });

  const withRelations = await prisma.duty.findUniqueOrThrow({
    where: { id: duty.id },
    include: {
      client: true,
      assignedTo: true,
      events: {
        where: { status: { in: [DutyStatus.PENDING, DutyStatus.IN_PROGRESS] } },
        orderBy: { scheduledFor: "asc" },
        take: 1
      }
    }
  });

  return NextResponse.json(toDutyRow(withRelations), { status: 201 });
import { NextRequest, NextResponse } from "next/server";

import { getDefaultClientId, getDutiesForClient } from "@/lib/duty-store";
import type { DutySummary, DutyTimelineEntry } from "@/models/duty-summary";

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
