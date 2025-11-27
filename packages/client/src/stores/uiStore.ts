import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean

  // Actions
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: true,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false })
}))
