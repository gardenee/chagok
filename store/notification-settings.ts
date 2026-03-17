import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  partnerTransaction: boolean;
  comment: boolean;
  fixedExpenseReminder: boolean;
  budgetExceeded: boolean;
  mySchedule: boolean;
  togetherSchedule: boolean;
  setPartnerTransaction: (value: boolean) => void;
  setComment: (value: boolean) => void;
  setFixedExpenseReminder: (value: boolean) => void;
  setBudgetExceeded: (value: boolean) => void;
  setMySchedule: (value: boolean) => void;
  setTogetherSchedule: (value: boolean) => void;
}

export const useNotificationSettingsStore = create<NotificationSettings>()(
  persist(
    set => ({
      partnerTransaction: true,
      comment: true,
      fixedExpenseReminder: true,
      budgetExceeded: true,
      mySchedule: true,
      togetherSchedule: true,
      setPartnerTransaction: value => set({ partnerTransaction: value }),
      setComment: value => set({ comment: value }),
      setFixedExpenseReminder: value => set({ fixedExpenseReminder: value }),
      setBudgetExceeded: value => set({ budgetExceeded: value }),
      setMySchedule: value => set({ mySchedule: value }),
      setTogetherSchedule: value => set({ togetherSchedule: value }),
    }),
    {
      name: 'notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
