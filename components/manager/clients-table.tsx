"use client";

import { useQuery } from "@tanstack/react-query";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { ClientRow } from "@/app/(dashboard)/manager/actions";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const clientsKey = ["manager", "clients"] as const;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
  }).format(date);
}

const columns: ColumnDef<ClientRow>[] = [
  {
    accessorKey: "name",
    header: "Client",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    size: 250
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.description ?? "—"}</span>
  },
  {
    accessorKey: "activeDutyCount",
    header: () => <span className="block text-right">Active duties</span>,
    cell: ({ row }) => <span className="block text-right font-medium">{row.original.activeDutyCount}</span>,
    size: 120
  },
  {
    accessorKey: "totalDutyCount",
    header: () => <span className="block text-right">Total duties</span>,
    cell: ({ row }) => <span className="block text-right">{row.original.totalDutyCount}</span>,
    size: 120
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
    size: 180
  }
];

export function ClientsTable({ initialData }: { initialData: ClientRow[] }): JSX.Element {
  const [search, setSearch] = useState("");

  const { data = [] } = useQuery({
    queryKey: clientsKey,
    queryFn: async (): Promise<ClientRow[]> => {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Failed to load clients");
      }
      return (await response.json()) as ClientRow[];
    },
    initialData
  });

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter((client) => client.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-xs">
          <label htmlFor="client-search" className="mb-1 block text-xs font-medium text-muted-foreground">
            Search clients
          </label>
          <Input
            id="client-search"
            placeholder="Search by name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} results</span>
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
              <TableRow key={row.id}>
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
                  No clients match your search.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
