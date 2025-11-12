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
}
