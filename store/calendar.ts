import { create } from 'zustand';

interface CalendarStore {
  pendingReturnDate: string | null;
  setPendingReturnDate: (date: string | null) => void;
}

export const useCalendarStore = create<CalendarStore>(set => ({
  pendingReturnDate: null,
  setPendingReturnDate: date => set({ pendingReturnDate: date }),
}));
