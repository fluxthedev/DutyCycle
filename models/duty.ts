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

export interface DutyEventMutation {
  dutyId: string;
  status: DutyStatus;
  clientId: string;
  lifecycle: DutyLifecycle;
  notes?: string;
  attachmentName?: string;
}
