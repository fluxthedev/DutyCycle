import { randomUUID } from "node:crypto";

export type DutyLifecycle = "ACTIVE" | "ARCHIVED";
export type DutyStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface DutyRecord {
  id: string;
  clientId: string;
  title: string;
  description: string;
  dueDate: string;
  frequency: string;
  lifecycle: DutyLifecycle;
  status: DutyStatus;
  requiresAttachment?: boolean;
  notesRequired?: boolean;
}

export interface DutyEventRecord {
  id: string;
  dutyId: string;
  clientId: string;
  status: DutyStatus;
  createdAt: string;
  notes?: string;
  attachmentName?: string;
}

export interface DutyLogRecord {
  id: string;
  dutyId: string;
  clientId: string;
  message: string;
  createdAt: string;
  lifecycle: DutyLifecycle;
  status: DutyStatus;
}

export interface DutyStoreSnapshot {
  duties: DutyRecord[];
  events: DutyEventRecord[];
  logs: DutyLogRecord[];
}

interface DutyEventInput {
  dutyId: string;
  status: DutyStatus;
  clientId: string;
  lifecycle: DutyLifecycle;
  notes?: string;
  attachmentName?: string;
}

const DEFAULT_CLIENT_ID = "acme-co";

declare global {
  // eslint-disable-next-line no-var
  var __dutyStore: DutyStoreSnapshot | undefined;
}

function createInitialDuties(): DutyRecord[] {
  const now = new Date();
  const currentWeekDay = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - currentWeekDay);
  return [
    {
      id: "duty-1",
      clientId: DEFAULT_CLIENT_ID,
      title: "Patch critical servers",
      description: "Apply security patches to production cluster",
      dueDate: new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      frequency: "Weekly",
      lifecycle: "ACTIVE",
      status: "IN_PROGRESS",
      requiresAttachment: true
    },
    {
      id: "duty-2",
      clientId: DEFAULT_CLIENT_ID,
      title: "Rotate access tokens",
      description: "Rotate API gateway tokens for vendor integrations",
      dueDate: new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      frequency: "Weekly",
      lifecycle: "ACTIVE",
      status: "PENDING",
      notesRequired: true
    },
    {
      id: "duty-3",
      clientId: DEFAULT_CLIENT_ID,
      title: "Archive monthly billing records",
      description: "Archive billing records to cold storage",
      dueDate: new Date(start.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      frequency: "Monthly",
      lifecycle: "ARCHIVED",
      status: "COMPLETED"
    }
  ];
}

function createInitialEvents(): DutyEventRecord[] {
  const archivedDuty = "duty-3";
  return [
    {
      id: "event-archived",
      dutyId: archivedDuty,
      clientId: DEFAULT_CLIENT_ID,
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Monthly archive completed",
      attachmentName: "archive-report.pdf"
    }
  ];
}

function createInitialLogs(): DutyLogRecord[] {
  const createdAt = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: "log-archived",
      dutyId: "duty-3",
      clientId: DEFAULT_CLIENT_ID,
      message: "Duty archived after completion",
      createdAt,
      lifecycle: "ARCHIVED",
      status: "COMPLETED"
    }
  ];
}

function ensureStore(): DutyStoreSnapshot {
  if (!globalThis.__dutyStore) {
    globalThis.__dutyStore = {
      duties: createInitialDuties(),
      events: createInitialEvents(),
      logs: createInitialLogs()
    } satisfies DutyStoreSnapshot;
  }
  return globalThis.__dutyStore;
}

export function getDutyStore(): DutyStoreSnapshot {
  return ensureStore();
}

export function recordDutyEvent(input: DutyEventInput): DutyEventRecord {
  const store = ensureStore();
  const duty = store.duties.find((item) => item.id === input.dutyId && item.clientId === input.clientId);
  if (!duty) {
    throw new Error("Duty not found");
  }

  duty.status = input.status;
  duty.lifecycle = input.lifecycle;

  const event: DutyEventRecord = {
    id: randomUUID(),
    dutyId: duty.id,
    clientId: duty.clientId,
    status: input.status,
    createdAt: new Date().toISOString(),
    notes: input.notes,
    attachmentName: input.attachmentName
  };

  store.events.push(event);

  const log: DutyLogRecord = {
    id: randomUUID(),
    dutyId: duty.id,
    clientId: duty.clientId,
    message:
      input.status === "COMPLETED"
        ? `${duty.title} marked completed`
        : `${duty.title} reverted to pending`,
    createdAt: event.createdAt,
    lifecycle: duty.lifecycle,
    status: input.status
  };

  store.logs.push(log);

  return event;
}

export function getDutiesForClient(clientId: string): DutyStoreSnapshot {
  const store = ensureStore();
  const duties = store.duties.filter((duty) => duty.clientId === clientId);
  const events = store.events.filter((event) => event.clientId === clientId);
  const logs = store.logs
    .filter((log) => log.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    duties,
    events,
    logs
  };
}

export function getDefaultClientId(): string {
  return DEFAULT_CLIENT_ID;
}
