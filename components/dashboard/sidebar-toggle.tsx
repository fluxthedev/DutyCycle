"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/stores/dashboard-store";

export function SidebarToggle(): JSX.Element {
  const isSidebarOpen = useDashboardStore((state) => state.isSidebarOpen);
  const toggleSidebar = useDashboardStore((state) => state.toggleSidebar);

  const handleToggle = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <Button variant="outline" onClick={handleToggle} aria-pressed={isSidebarOpen} className="gap-2">
      {isSidebarOpen ? (
        <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
      ) : (
        <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
      )}
      {isSidebarOpen ? "Hide" : "Show"} sidebar
    </Button>
  );
}
