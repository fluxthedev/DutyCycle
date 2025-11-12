import { DutyStatus } from "@prisma/client";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDutyBuckets } from "./actions";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
  }).format(date);
}

const statusCopy: Record<DutyStatus, string> = {
  [DutyStatus.PENDING]: "Pending",
  [DutyStatus.IN_PROGRESS]: "In progress",
  [DutyStatus.COMPLETED]: "Completed",
  [DutyStatus.SKIPPED]: "Skipped"
};

function EmptyState({ message }: { message: string }): JSX.Element {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

function DutyList({ summary }: { summary: Awaited<ReturnType<typeof getDutyBuckets>>["today"] }): JSX.Element {
  if (summary.length === 0) {
    return <EmptyState message="All clear for now." />;
  }

  return (
    <ul className="space-y-3">
      {summary.map((item) => (
        <li key={item.id} className="rounded border bg-muted/40 p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.clientName} • {statusCopy[item.status]}
                {item.assignedTo ? ` • ${item.assignedTo}` : ""}
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{formatDate(item.scheduledFor)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function ManagerDashboardPage(): Promise<JSX.Element> {
  const buckets = await getDutyBuckets();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Manager dashboard</h1>
        <p className="text-muted-foreground">Stay ahead of duty schedules and assignments.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s duties</CardTitle>
            <CardDescription>Events happening over the next 24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <DutyList summary={buckets.today} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming (7 days)</CardTitle>
            <CardDescription>Review what&apos;s next on the schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <DutyList summary={buckets.upcoming} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
            <CardDescription>Follow up on anything behind schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <DutyList summary={buckets.overdue} />
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-4">
        <Link href="/manager/clients" className="text-sm font-medium text-primary underline">
          View clients
        </Link>
        <Link href="/manager/duties" className="text-sm font-medium text-primary underline">
          Manage duties
        </Link>
      </div>
    </div>
  );
}
