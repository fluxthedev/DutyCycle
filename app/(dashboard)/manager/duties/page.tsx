import { DutiesTable } from "@/components/manager/duties-table";

import { getDutiesTableData } from "../actions";

export default async function ManagerDutiesPage(): Promise<JSX.Element> {
  const duties = await getDutiesTableData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Duties</h1>
        <p className="text-sm text-muted-foreground">Track status, frequency, and assignments.</p>
      </div>
      <DutiesTable initialData={duties} />
    </div>
  );
}
