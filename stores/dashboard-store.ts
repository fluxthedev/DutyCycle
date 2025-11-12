import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { DashboardPreferencesState } from "@/models/dashboard-store";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

export const useDashboardStore = create<DashboardPreferencesState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
    }),
    {
      name: "dashboard-preferences",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : noopStorage))
    }
  )
);
