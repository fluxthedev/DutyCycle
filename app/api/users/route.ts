import { NextResponse } from "next/server";

import { getAssignableUsers } from "@/app/(dashboard)/manager/actions";

export async function GET(): Promise<NextResponse> {
  const users = await getAssignableUsers();
  return NextResponse.json(users);
}
