import type { DutyLifecycle, DutyStatus } from "@/models/duty";

export interface DutyEventPayload {
  dutyId: string;
  status: DutyStatus;
  clientId: string;
  lifecycle: DutyLifecycle;
  notes?: string;
  attachmentName?: string;
}

export interface DutyCompletionPayload {
  dutyId: string;
  status: DutyStatus;
  clientId: string;
  lifecycle: DutyLifecycle;
  notes?: string;
  attachment: File | null;
}
