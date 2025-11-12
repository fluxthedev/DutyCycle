import { NextResponse } from "next/server";

import { getClientsTableData } from "@/app/(dashboard)/manager/actions";

export async function GET(): Promise<NextResponse> {
  const clients = await getClientsTableData();
  return NextResponse.json(clients);
}
