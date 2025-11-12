import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DutyDashboard } from "@/app/(dashboard)/client/page";
import type { DutyLifecycle, DutyRecord } from "@/lib/duty-store";

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

interface MockDutyResponse {
  clientId: string;
  weekRange: { start: string; end: string };
  active: DutyRecord[];
  archived: DutyRecord[];
  timeline: Array<{ id: string; dutyId: string; dutyTitle: string; message: string; createdAt: string; status: string; lifecycle: DutyLifecycle }>;
  totals: {
    pending: number;
    inProgress: number;
    completed: number;
  };
}

describe("DutyDashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:mock-download")
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn()
    });
  });

  const setup = async (response: MockDutyResponse) => {
    let currentResponse: MockDutyResponse = JSON.parse(JSON.stringify(response));

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/api/duties")) {
        return new Response(JSON.stringify(currentResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (url.includes("/api/duty-events")) {
        const bodyRaw = init?.body;
        const parsed = typeof bodyRaw === "string" ? JSON.parse(bodyRaw) : {};
        const { dutyId, status } = parsed as { dutyId: string; status: "PENDING" | "COMPLETED" };
        const target = currentResponse.active.find((duty) => duty.id === dutyId) ?? currentResponse.archived.find((duty) => duty.id === dutyId);
        if (target) {
          if (target.lifecycle === "ACTIVE") {
            if (target.status === "PENDING" && status === "COMPLETED") {
              currentResponse.totals.pending -= 1;
              currentResponse.totals.completed += 1;
            }
            if (target.status === "COMPLETED" && status === "PENDING") {
              currentResponse.totals.pending += 1;
              currentResponse.totals.completed -= 1;
            }
          }
          target.status = status;
        }
        return new Response(JSON.stringify({ event: { id: "event" }, duty: target }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (url.includes("/api/duty-logs")) {
        return new Response("[]", {
          status: 200,
          headers: { "Content-Type": url.includes("format=csv") ? "text/csv" : "application/json" }
        });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });

    globalThis.fetch = fetchMock as typeof fetch;

    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <DutyDashboard clientId={response.clientId} />
      </QueryClientProvider>
    );

    await screen.findByText(/Client duty tracker/i);

    return fetchMock;
  };

  it("allows completion toggles for active and archived duties", async () => {
    const response: MockDutyResponse = {
      clientId: "acme-co",
      weekRange: { start: new Date().toISOString(), end: new Date().toISOString() },
      active: [
        {
          id: "duty-active",
          clientId: "acme-co",
          title: "Weekly security review",
          description: "Review threat reports",
          dueDate: new Date().toISOString(),
          frequency: "Weekly",
          lifecycle: "ACTIVE",
          status: "PENDING"
        }
      ],
      archived: [
        {
          id: "duty-archived",
          clientId: "acme-co",
          title: "Legacy cleanup",
          description: "Archive legacy configs",
          dueDate: new Date().toISOString(),
          frequency: "Monthly",
          lifecycle: "ARCHIVED",
          status: "COMPLETED"
        }
      ],
      timeline: [],
      totals: { pending: 1, inProgress: 0, completed: 0 }
    };

    const fetchMock = await setup(response);
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: /weekly security review/i });

    const completeButton = screen.getByRole("button", { name: /mark complete/i });
    await user.click(completeButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/duty-events"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"status\":\"COMPLETED\"")
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /archived duties/i }));
    await screen.findByRole("heading", { name: /legacy cleanup/i });

    const reopenButton = screen.getByRole("button", { name: /reopen duty/i });
    await user.click(reopenButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/duty-events"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"status\":\"PENDING\"")
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /mark complete/i })).toBeEnabled();
    });
  });

  it("downloads duty logs using the selected lifecycle", async () => {
    const response: MockDutyResponse = {
      clientId: "acme-co",
      weekRange: { start: new Date().toISOString(), end: new Date().toISOString() },
      active: [
        {
          id: "duty-a",
          clientId: "acme-co",
          title: "Duty A",
          description: "",
          dueDate: new Date().toISOString(),
          frequency: "Weekly",
          lifecycle: "ACTIVE",
          status: "PENDING"
        }
      ],
      archived: [
        {
          id: "duty-b",
          clientId: "acme-co",
          title: "Duty B",
          description: "",
          dueDate: new Date().toISOString(),
          frequency: "Weekly",
          lifecycle: "ARCHIVED",
          status: "COMPLETED"
        }
      ],
      timeline: [],
      totals: { pending: 1, inProgress: 0, completed: 0 }
    };

    const fetchMock = await setup(response);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /archived duties/i }));

    const jsonButton = await screen.findByRole("button", { name: /download json/i });
    await user.click(jsonButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/duty-logs?clientId=acme-co&lifecycle=ARCHIVED&format=json"),
        expect.anything()
      );
    });

    const csvButton = screen.getByRole("button", { name: /download csv/i });
    await user.click(csvButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/duty-logs?clientId=acme-co&lifecycle=ARCHIVED&format=csv"),
        expect.anything()
      );
    });
  });
});
