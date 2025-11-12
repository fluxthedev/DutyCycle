import { NextResponse } from "next/server";

import {
  DutyLifecycle,
  DutyStatus,
  getDutyStore,
  recordDutyEvent
} from "@/lib/duty-store";

const DUTY_STATUS_VALUES: DutyStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const LIFECYCLE_VALUES: DutyLifecycle[] = ["ACTIVE", "ARCHIVED"];

function isDutyStatus(value: string | null): value is DutyStatus {
  return value !== null && DUTY_STATUS_VALUES.includes(value as DutyStatus);
}

function isLifecycle(value: string | null): value is DutyLifecycle {
  return value !== null && LIFECYCLE_VALUES.includes(value as DutyLifecycle);
}

interface DutyEventPayload {
  dutyId: string;
  status: DutyStatus;
  clientId: string;
  lifecycle: DutyLifecycle;
  notes?: string;
  attachmentName?: string;
}

async function parsePayload(request: Request): Promise<DutyEventPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const dutyId = formData.get("dutyId");
    const status = formData.get("status");
    const clientId = formData.get("clientId");
    const lifecycle = formData.get("lifecycle");
    const notes = formData.get("notes");
    const attachment = formData.get("attachment");

    const payload: DutyEventPayload = {
      dutyId: String(dutyId ?? ""),
      status: "PENDING",
      clientId: String(clientId ?? ""),
      lifecycle: "ACTIVE"
    };

    const statusValue = typeof status === "string" ? status : null;
    if (isDutyStatus(statusValue)) {
      payload.status = statusValue;
    }

    const lifecycleValue = typeof lifecycle === "string" ? lifecycle : null;
    if (isLifecycle(lifecycleValue)) {
      payload.lifecycle = lifecycleValue;
    }

    if (typeof notes === "string" && notes.trim().length > 0) {
      payload.notes = notes.trim();
    }

    if (attachment instanceof File && attachment.size > 0) {
      payload.attachmentName = attachment.name;
    }

    return payload;
  }

  const body = await request.json();

  const payload: DutyEventPayload = {
    dutyId: String(body?.dutyId ?? ""),
    status: isDutyStatus(body?.status) ? body.status : "PENDING",
    clientId: String(body?.clientId ?? ""),
    lifecycle: isLifecycle(body?.lifecycle) ? body.lifecycle : "ACTIVE"
  };

  if (typeof body?.notes === "string" && body.notes.trim().length > 0) {
    payload.notes = body.notes.trim();
  }
  if (typeof body?.attachmentName === "string" && body.attachmentName.trim().length > 0) {
    payload.attachmentName = body.attachmentName.trim();
  }

  return payload;
}

function validatePayload(payload: DutyEventPayload): void {
  if (!payload.dutyId) {
    throw new Error("dutyId is required");
  }
  if (!payload.clientId) {
    throw new Error("clientId is required");
  }
  if (!isDutyStatus(payload.status)) {
    throw new Error("Invalid duty status");
  }
  if (!isLifecycle(payload.lifecycle)) {
    throw new Error("Invalid lifecycle value");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parsePayload(request);
    validatePayload(payload);

    const event = recordDutyEvent(payload);
    const store = getDutyStore();
    const duty = store.duties.find((item) => item.id === payload.dutyId && item.clientId === payload.clientId);

    if (!duty) {
      throw new Error("Duty not found after update");
    }

    return NextResponse.json({ event, duty });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
