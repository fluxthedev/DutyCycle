import { DutyFrequency, DutyStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { toDutyRow } from "@/app/(dashboard)/manager/actions";
import { prisma } from "@/lib/prisma";

const updateDutySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  frequency: z.nativeEnum(DutyFrequency).optional(),
  status: z.nativeEnum(DutyStatus).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const payload = await request.json();
  const parsed = updateDutySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = Number(params.id);

  const duty = await prisma.duty.update({
    where: { id },
    data: parsed.data
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

  return NextResponse.json(toDutyRow(withRelations));
}
