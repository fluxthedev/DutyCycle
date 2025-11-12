"use client";

import { DutyFrequency, DutyStatus } from "@prisma/client";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { ClientRow, DutyRow } from "@/app/(dashboard)/manager/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const dutiesKey = ["manager", "duties"] as const;
const usersKey = ["manager", "users"] as const;
const clientOptionsKey = ["manager", "client-options"] as const;

type CreatePayload = {
  title: string;
  clientId: number;
  frequency: DutyFrequency;
  assignedToId?: number | null;
};

type UpdatePayload = {
  id: number;
  status?: DutyStatus;
  frequency?: DutyFrequency;
};

type AssignPayload = {
  id: number;
  assignedToId: number | null;
};

function formatDueDate(iso: string | null): string {
  if (!iso) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
  }).format(new Date(iso));
}

const statusVariant: Record<DutyStatus, "default" | "success" | "warning" | "outline"> = {
  [DutyStatus.PENDING]: "warning",
  [DutyStatus.IN_PROGRESS]: "default",
  [DutyStatus.COMPLETED]: "success",
  [DutyStatus.SKIPPED]: "outline"
};

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as T;
}

function optimisticUpdate(
  queryClient: QueryClient,
  updater: (current: DutyRow[]) => DutyRow[]
): { previous?: DutyRow[] } {
  const previous = queryClient.getQueryData<DutyRow[]>(dutiesKey);
  queryClient.setQueryData<DutyRow[]>(dutiesKey, (current) => updater(current ?? []));
  return { previous };
}

function restoreOnError(queryClient: QueryClient, context?: { previous?: DutyRow[] }): void {
  if (context?.previous) {
    queryClient.setQueryData(dutiesKey, context.previous);
  }
}

export function DutiesTable({ initialData }: { initialData: DutyRow[] }): JSX.Element {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DutyStatus | "ALL">("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState<DutyFrequency | "ALL">("ALL");
  const [newDutyTitle, setNewDutyTitle] = useState("");
  const [newDutyClientId, setNewDutyClientId] = useState<number | null>(null);
  const [newDutyFrequency, setNewDutyFrequency] = useState<DutyFrequency>(DutyFrequency.ONCE);

  const { data: duties = [] } = useQuery({
    queryKey: dutiesKey,
    queryFn: (): Promise<DutyRow[]> => jsonFetch<DutyRow[]>("/api/duties"),
    initialData
  });

  const { data: users = [] } = useQuery({
    queryKey: usersKey,
    queryFn: (): Promise<Array<{ id: number; name: string }>> => jsonFetch("/api/users")
  });

  const { data: clients = [] } = useQuery({
    queryKey: clientOptionsKey,
    queryFn: async (): Promise<Array<{ id: number; name: string }>> => {
      const raw = await jsonFetch<ClientRow[]>("/api/clients");
      return raw.map(({ id, name }) => ({ id, name }));
    },
    onSuccess: (loaded) => {
      if (newDutyClientId === null && loaded.length > 0) {
        setNewDutyClientId(loaded[0]?.id ?? null);
      }
    }
  });

  const createDutyMutation = useMutation<DutyRow, Error, CreatePayload, { previous?: DutyRow[]; tempId: number }>(
    async (payload) =>
      jsonFetch<DutyRow>("/api/duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    {
      onMutate: async (payload) => {
        await queryClient.cancelQueries({ queryKey: dutiesKey });
        const tempId = Date.now();
        const context = optimisticUpdate(queryClient, (current) => [
          {
            id: tempId,
            title: payload.title,
            description: null,
            clientId: payload.clientId,
            clientName: clients.find((client) => client.id === payload.clientId)?.name ?? "New client",
            status: DutyStatus.PENDING,
            frequency: payload.frequency,
            assignedToId: payload.assignedToId ?? null,
            assignedToName:
              payload.assignedToId != null
                ? users.find((user) => user.id === payload.assignedToId)?.name ?? null
                : null,
            nextDue: null
          },
          ...current
        ]);
        return { ...context, tempId };
      },
      onError: (error, _variables, context) => {
        console.error(error);
        restoreOnError(queryClient, context);
      },
      onSuccess: (created, _variables, context) => {
        queryClient.setQueryData<DutyRow[]>(dutiesKey, (current = []) =>
          current.map((entry) => (entry.id === context?.tempId ? created : entry))
        );
        setNewDutyTitle("");
        setNewDutyFrequency(DutyFrequency.ONCE);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: dutiesKey });
      }
    }
  );

  const updateDutyMutation = useMutation<DutyRow, Error, UpdatePayload, { previous?: DutyRow[] }>(
    async ({ id, ...payload }) =>
      jsonFetch<DutyRow>(`/api/duties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    {
      onMutate: async (payload) => {
        await queryClient.cancelQueries({ queryKey: dutiesKey });
        return optimisticUpdate(queryClient, (current) =>
          current.map((row) =>
            row.id === payload.id
              ? {
                  ...row,
                  status: payload.status ?? row.status,
                  frequency: payload.frequency ?? row.frequency
                }
              : row
          )
        );
      },
      onError: (error, _variables, context) => {
        console.error(error);
        restoreOnError(queryClient, context);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: dutiesKey });
      }
    }
  );

  const assignDutyMutation = useMutation<DutyRow, Error, AssignPayload, { previous?: DutyRow[] }>(
    async ({ id, assignedToId }) =>
      jsonFetch<DutyRow>(`/api/duties/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId })
      }),
    {
      onMutate: async (payload) => {
        await queryClient.cancelQueries({ queryKey: dutiesKey });
        return optimisticUpdate(queryClient, (current) =>
          current.map((row) =>
            row.id === payload.id
              ? {
                  ...row,
                  assignedToId: payload.assignedToId,
                  assignedToName:
                    payload.assignedToId != null
                      ? users.find((user) => user.id === payload.assignedToId)?.name ?? null
                      : null
                }
              : row
          )
        );
      },
      onError: (error, _variables, context) => {
        console.error(error);
        restoreOnError(queryClient, context);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: dutiesKey });
      }
    }
  );

  const archiveDutyMutation = useMutation<DutyRow, Error, number, { previous?: DutyRow[] }>(
    async (id) => jsonFetch<DutyRow>(`/api/duties/${id}/archive`, { method: "POST" }),
    {
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: dutiesKey });
        return optimisticUpdate(queryClient, (current) =>
          current.map((row) => (row.id === id ? { ...row, status: DutyStatus.COMPLETED } : row))
        );
      },
      onError: (error, _variables, context) => {
        console.error(error);
        restoreOnError(queryClient, context);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: dutiesKey });
      }
    }
  );

  const updateDuty = updateDutyMutation.mutate;
  const assignDuty = assignDutyMutation.mutate;
  const archiveDuty = archiveDutyMutation.mutate;

  const filteredDuties = useMemo(() => {
    return duties.filter((duty) => {
      const matchesStatus = statusFilter === "ALL" || duty.status === statusFilter;
      const matchesFrequency = frequencyFilter === "ALL" || duty.frequency === frequencyFilter;
      return matchesStatus && matchesFrequency;
    });
  }, [duties, statusFilter, frequencyFilter]);

  const columns = useMemo<ColumnDef<DutyRow>[]>(
    () => [
      {
        header: "Title",
        accessorKey: "title",
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
        size: 220
      },
      {
        header: "Client",
        accessorKey: "clientName",
        cell: ({ row }) => row.original.clientName,
        size: 180
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge variant={statusVariant[row.original.status]}>
              {row.original.status.replace("_", " ")}
            </Badge>
            <Select
              aria-label={`Update status for ${row.original.title}`}
              value={row.original.status}
              onChange={(event) => updateDuty({ id: row.original.id, status: event.target.value as DutyStatus })}
            >
              {Object.values(DutyStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
        ),
        size: 200
      },
      {
        header: "Frequency",
        cell: ({ row }) => (
          <Select
            aria-label={`Update frequency for ${row.original.title}`}
            value={row.original.frequency}
            onChange={(event) => updateDuty({ id: row.original.id, frequency: event.target.value as DutyFrequency })}
          >
            {Object.values(DutyFrequency).map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency.replace("_", " ")}
              </option>
            ))}
          </Select>
        ),
        size: 150
      },
      {
        header: "Owner",
        cell: ({ row }) => (
          <Select
            aria-label={`Assign owner for ${row.original.title}`}
            value={row.original.assignedToId?.toString() ?? ""}
            onChange={(event) =>
              assignDuty({
                id: row.original.id,
                assignedToId: event.target.value ? Number(event.target.value) : null
              })
            }
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        ),
        size: 200
      },
      {
        header: "Next due",
        accessorKey: "nextDue",
        cell: ({ row }) => formatDueDate(row.original.nextDue),
        size: 180
      },
      {
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => archiveDuty(row.original.id)}
              disabled={row.original.status === DutyStatus.COMPLETED}
            >
              {row.original.status === DutyStatus.COMPLETED ? "Completed" : "Mark complete"}
            </Button>
          </div>
        ),
        size: 160
      }
    ],
    [assignDuty, archiveDuty, updateDuty, users]
  );

  const table = useReactTable({
    data: filteredDuties,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const canSubmitNewDuty = Boolean(newDutyTitle && newDutyClientId != null && !createDutyMutation.isPending);

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-md border p-4">
        <h2 className="text-sm font-semibold">Create duty</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label htmlFor="new-duty-title" className="mb-1 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <Input
              id="new-duty-title"
              placeholder="Example: HVAC filter swap"
              value={newDutyTitle}
              onChange={(event) => setNewDutyTitle(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="new-duty-client" className="mb-1 block text-xs font-medium text-muted-foreground">
              Client
            </label>
            <Select
              id="new-duty-client"
              value={newDutyClientId?.toString() ?? ""}
              onChange={(event) => setNewDutyClientId(event.target.value ? Number(event.target.value) : null)}
              disabled={clients.length === 0}
            >
              {clients.length === 0 ? <option value="">No clients</option> : null}
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="new-duty-frequency" className="mb-1 block text-xs font-medium text-muted-foreground">
              Frequency
            </label>
            <Select
              id="new-duty-frequency"
              value={newDutyFrequency}
              onChange={(event) => setNewDutyFrequency(event.target.value as DutyFrequency)}
            >
              {Object.values(DutyFrequency).map((value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button
          type="button"
          onClick={() =>
            createDutyMutation.mutate({
              title: newDutyTitle,
              clientId: newDutyClientId!,
              frequency: newDutyFrequency
            })
          }
          disabled={!canSubmitNewDuty}
          className="w-fit"
        >
          {createDutyMutation.isPending ? "Creating…" : "Add duty"}
        </Button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full max-w-xs">
            <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-muted-foreground">
              Status filter
            </label>
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as DutyStatus | "ALL")}
            >
              <option value="ALL">All statuses</option>
              {Object.values(DutyStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full max-w-xs">
            <label htmlFor="frequency-filter" className="mb-1 block text-xs font-medium text-muted-foreground">
              Frequency filter
            </label>
            <Select
              id="frequency-filter"
              value={frequencyFilter}
              onChange={(event) => setFrequencyFilter(event.target.value as DutyFrequency | "ALL")}
            >
              <option value="ALL">All frequencies</option>
              {Object.values(DutyFrequency).map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{filteredDuties.length} results</span>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-testid={`duty-row-${row.original.id}`}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                    No duties match the selected filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
