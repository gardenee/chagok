import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarStore {
  pendingReturnDate: string | null;
  setPendingReturnDate: (date: string | null) => void;
  weekStartsOnMonday: boolean;
  setWeekStartsOnMonday: (value: boolean) => void;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    set => ({
      pendingReturnDate: null,
      setPendingReturnDate: date => set({ pendingReturnDate: date }),
      weekStartsOnMonday: false,
      setWeekStartsOnMonday: value => set({ weekStartsOnMonday: value }),
    }),
    {
      name: 'calendar-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ weekStartsOnMonday: state.weekStartsOnMonday }),
    },
  ),
);
