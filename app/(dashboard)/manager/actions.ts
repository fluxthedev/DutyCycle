"use server";

import { DutyFrequency, DutyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES: DutyStatus[] = [DutyStatus.PENDING, DutyStatus.IN_PROGRESS];

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);
  next.setMilliseconds(next.getMilliseconds() - 1);
  return next;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export type DutyEventSummary = {
  id: number;
  dutyId: number;
  title: string;
  clientName: string;
  status: DutyStatus;
  scheduledFor: string;
  frequency: DutyFrequency;
  assignedTo?: string | null;
};

export async function getDutyBuckets(): Promise<{
  today: DutyEventSummary[];
  upcoming: DutyEventSummary[];
  overdue: DutyEventSummary[];
}> {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);
  const upcomingEnd = addDays(start, 7);

  const [todayEvents, upcomingEvents, overdueEvents] = await Promise.all([
    prisma.dutyEvent.findMany({
      where: {
        scheduledFor: { gte: start, lte: end },
        status: { in: ACTIVE_STATUSES }
      },
      include: { duty: { include: { client: true, assignedTo: true } } },
      orderBy: { scheduledFor: "asc" }
    }),
    prisma.dutyEvent.findMany({
      where: {
        scheduledFor: { gt: end, lte: upcomingEnd },
        status: { in: ACTIVE_STATUSES }
      },
      include: { duty: { include: { client: true, assignedTo: true } } },
      orderBy: { scheduledFor: "asc" }
    }),
    prisma.dutyEvent.findMany({
      where: {
        scheduledFor: { lt: start },
        status: { in: ACTIVE_STATUSES }
      },
      include: { duty: { include: { client: true, assignedTo: true } } },
      orderBy: { scheduledFor: "asc" }
    })
  ]);

  const toSummary = (events: typeof todayEvents): DutyEventSummary[] =>
    events.map((event) => ({
      id: event.id,
      dutyId: event.dutyId,
      title: event.duty.title,
      clientName: event.duty.client.name,
      status: event.status,
      scheduledFor: event.scheduledFor.toISOString(),
      frequency: event.duty.frequency,
      assignedTo: event.duty.assignedTo?.name ?? null
    }));

  return {
    today: toSummary(todayEvents),
    upcoming: toSummary(upcomingEvents),
    overdue: toSummary(overdueEvents)
  };
}

export type ClientRow = {
  id: number;
  name: string;
  description: string | null;
  activeDutyCount: number;
  totalDutyCount: number;
  updatedAt: string;
};

export async function getClientsTableData(): Promise<ClientRow[]> {
  const clients = await prisma.client.findMany({
    include: {
      duties: {
        select: {
          status: true
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return clients.map((client) => {
    const activeDutyCount = client.duties.filter((duty) => duty.status !== DutyStatus.COMPLETED).length;

    return {
      id: client.id,
      name: client.name,
      description: client.description ?? null,
      activeDutyCount,
      totalDutyCount: client.duties.length,
      updatedAt: client.updatedAt.toISOString()
    } satisfies ClientRow;
  });
}

export type DutyRow = {
  id: number;
  title: string;
  description: string | null;
  clientId: number;
  clientName: string;
  status: DutyStatus;
  frequency: DutyFrequency;
  assignedToId: number | null;
  assignedToName: string | null;
  nextDue: string | null;
};

type DutyLike = {
  id: number;
  title: string;
  description: string | null;
  clientId: number;
  client: { name: string };
  status: DutyStatus;
  frequency: DutyFrequency;
  assignedToId: number | null;
  assignedTo: { name: string } | null;
  events: { scheduledFor: Date }[];
};

export function toDutyRow(duty: DutyLike): DutyRow {
  return {
    id: duty.id,
    title: duty.title,
    description: duty.description ?? null,
    clientId: duty.clientId,
    clientName: duty.client.name,
    status: duty.status,
    frequency: duty.frequency,
    assignedToId: duty.assignedToId ?? null,
    assignedToName: duty.assignedTo?.name ?? null,
    nextDue: duty.events[0]?.scheduledFor.toISOString() ?? null
  };
}

export async function getDutiesTableData(): Promise<DutyRow[]> {
  const duties = await prisma.duty.findMany({
    include: {
      client: true,
      assignedTo: true,
      events: {
        where: { status: { in: ACTIVE_STATUSES } },
        orderBy: { scheduledFor: "asc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return duties.map(toDutyRow);
}

export type UserOption = {
  id: number;
  name: string;
};

export async function getAssignableUsers(): Promise<UserOption[]> {
  const users = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "STAFF"] } },
    orderBy: { name: "asc" }
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name
  }));
}
