import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { KPIGrid } from "@/components/dashboard/kpi-grid";
import { SidebarToggle } from "@/components/dashboard/sidebar-toggle";
import { SystemStatus } from "@/components/dashboard/system-status";
import { dashboardSchema } from "@/lib/schemas/dashboard";

const dashboardConfig = dashboardSchema.parse({
  title: "Operations overview",
  description: "Monitor platform health, team response, and incident metrics at a glance.",
  kpis: [
    { label: "Active incidents", value: 3 },
    { label: "Mean time to resolution", value: 38, unit: "minute", format: "unit" },
    { label: "On-call engineers", value: 12 },
    { label: "Uptime", value: 99.98, format: "percent" }
  ]
});

export default function DashboardPage(): JSX.Element {
  const { title, description, kpis } = dashboardConfig;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader description={description}>{title}</PageHeader>
        <SidebarToggle />
      </div>
      <DashboardShell className="lg:grid-cols-3">
        <div className="lg:col-span-3">
          <KPIGrid items={kpis} />
        </div>
        <SystemStatus />
      </DashboardShell>
    </div>
  );
}
