import { ClientsTable } from "@/components/manager/clients-table";

import { getClientsTableData } from "../actions";

export default async function ManagerClientsPage(): Promise<JSX.Element> {
  const clients = await getClientsTableData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-muted-foreground">Manage client duty coverage and performance.</p>
      </div>
      <ClientsTable initialData={clients} />
    </div>
  );
}
