import { DutyStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { toDutyRow } from "@/app/(dashboard)/manager/actions";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const id = Number(params.id);

  const duty = await prisma.$transaction(async (tx) => {
    const updatedDuty = await tx.duty.update({
      where: { id },
      data: { status: DutyStatus.COMPLETED }
    });

    await tx.dutyEvent.updateMany({
      where: {
        dutyId: id,
        status: { in: [DutyStatus.PENDING, DutyStatus.IN_PROGRESS] }
      },
      data: {
        status: DutyStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    return updatedDuty;
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
