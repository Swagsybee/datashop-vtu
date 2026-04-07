import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  pinModal: { open: false, onSuccess: null, title: 'Confirm Transaction' },
  fundModal: false,
  scheduleModal: { open: false, type: null, payload: null },
  
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar:  () => set({ sidebarOpen: false }),
  
  openPinModal: (onSuccess, title) =>
    set({ pinModal: { open: true, onSuccess, title: title || 'Confirm Transaction' } }),
  closePinModal: () =>
    set({ pinModal: { open: false, onSuccess: null, title: 'Confirm Transaction' } }),
  
  openFundModal:  () => set({ fundModal: true }),
  closeFundModal: () => set({ fundModal: false }),
  
  openScheduleModal:  (type, payload) => set({ scheduleModal: { open: true, type, payload } }),
  closeScheduleModal: () => set({ scheduleModal: { open: false, type: null, payload: null } }),
}))
