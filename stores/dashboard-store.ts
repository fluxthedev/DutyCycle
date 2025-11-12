import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface DashboardState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
    }),
    {
      name: "dashboard-preferences",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : undefined))
    }
  )
);
