import type { KPI } from "@/lib/schemas/dashboard";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KPIGridProps {
  items: KPI[];
}

function formatValue(kpi: KPI): string {
  switch (kpi.format) {
    case "percent":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        maximumFractionDigits: 2
      }).format(kpi.value / 100);
    case "unit":
      return new Intl.NumberFormat("en-US", {
        style: "unit",
        unit: (kpi.unit ?? "item") as Intl.NumberFormatOptions["unit"],
        notation: "compact"
      }).format(kpi.value);
    default:
      return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(kpi.value);
  }
}

export function KPIGrid({ items }: KPIGridProps): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader>
            <CardDescription>{kpi.label}</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatValue(kpi)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Compared to last 24 hours</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
