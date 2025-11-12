import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

interface DashboardState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

export const useDashboardStore = create<DashboardState>()(
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
