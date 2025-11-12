import { DutyFrequency, DutyStatus } from "@prisma/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { Providers } from "@/app/providers";
import { DutiesTable } from "@/components/manager/duties-table";
import type { DutyRow } from "@/app/(dashboard)/manager/actions";
import { server } from "@/tests/mocks/server";

describe("DutiesTable", () => {
  const baseDuty: DutyRow = {
    id: 1,
    title: "Inspect lobby",
    description: null,
    clientId: 1,
    clientName: "Acme",
    status: DutyStatus.PENDING,
    frequency: DutyFrequency.DAILY,
    assignedToId: null,
    assignedToName: null,
    nextDue: new Date().toISOString()
  };

  beforeEach(() => {
    server.use(
      http.get("/api/users", () => HttpResponse.json([])),
      http.get("/api/clients", () => HttpResponse.json([]))
    );
  });

  it("filters duties by status", async () => {
    const duties: DutyRow[] = [
      baseDuty,
      { ...baseDuty, id: 2, title: "Completed duty", status: DutyStatus.COMPLETED },
      { ...baseDuty, id: 3, title: "In progress duty", status: DutyStatus.IN_PROGRESS }
    ];

    server.use(http.get("/api/duties", () => HttpResponse.json(duties)));

    render(
      <Providers>
        <DutiesTable initialData={duties} />
      </Providers>
    );

    await screen.findByTestId("duty-row-1");

    const statusFilter = screen.getByLabelText(/status filter/i);
    await userEvent.selectOptions(statusFilter, DutyStatus.COMPLETED);

    await waitFor(() => {
      expect(screen.getAllByTestId(/duty-row-/i)).toHaveLength(1);
    });

    expect(screen.getByTestId("duty-row-2")).toHaveTextContent("Completed duty");
  });

  it("optimistically marks a duty as completed", async () => {
    const duty: DutyRow = { ...baseDuty, id: 10 };

    server.use(
      http.get("/api/duties", () => HttpResponse.json([duty])),
      http.post("/api/duties/:id/archive", ({ params }) =>
        HttpResponse.json({ ...duty, id: Number(params.id), status: DutyStatus.COMPLETED })
      )
    );

    render(
      <Providers>
        <DutiesTable initialData={[duty]} />
      </Providers>
    );

    const completeButton = await screen.findByRole("button", { name: /mark complete/i });
    await userEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByTestId("duty-row-10")).toHaveTextContent(/Completed/i);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /completed/i })).toBeDisabled();
    });
  });
});
