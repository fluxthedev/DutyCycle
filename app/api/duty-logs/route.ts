import { NextRequest, NextResponse } from "next/server";

import {
  DutyLifecycle,
  DutyLogRecord,
  getDefaultClientId,
  getDutiesForClient
} from "@/lib/duty-store";

const textEncoder = new TextEncoder();

function createCsvStream(logs: DutyLogRecord[], dutyNameLookup: Map<string, string>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(textEncoder.encode("timestamp,duty,message,status,lifecycle\n"));
      for (const log of logs) {
        const dutyTitle = dutyNameLookup.get(log.dutyId) ?? "Unknown";
        const row = `${log.createdAt},"${dutyTitle.replace(/"/g, '""')}","${log.message.replace(/"/g, '""')}",${log.status},${log.lifecycle}\n`;
        controller.enqueue(textEncoder.encode(row));
      }
      controller.close();
    }
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") ?? getDefaultClientId();
  const format = searchParams.get("format") ?? "json";
  const lifecycle = searchParams.get("lifecycle") as DutyLifecycle | null;

  const store = getDutiesForClient(clientId);
  const dutyNameLookup = new Map(store.duties.map((duty) => [duty.id, duty.title]));

  let logs = store.logs;
  if (lifecycle && (lifecycle === "ACTIVE" || lifecycle === "ARCHIVED")) {
    logs = logs.filter((log) => log.lifecycle === lifecycle);
  }

  if (format === "csv") {
    const stream = createCsvStream(logs, dutyNameLookup);
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=duty-logs-${clientId}.csv`,
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json(
    {
      logs: logs.map((log) => ({
        ...log,
        dutyTitle: dutyNameLookup.get(log.dutyId) ?? "Unknown"
      }))
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
