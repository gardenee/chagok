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
  anniversaryReminder: boolean;
  setPartnerTransaction: (value: boolean) => void;
  setComment: (value: boolean) => void;
  setFixedExpenseReminder: (value: boolean) => void;
  setBudgetExceeded: (value: boolean) => void;
  setMySchedule: (value: boolean) => void;
  setTogetherSchedule: (value: boolean) => void;
  setAnniversaryReminder: (value: boolean) => void;
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
      anniversaryReminder: true,
      setPartnerTransaction: value => set({ partnerTransaction: value }),
      setComment: value => set({ comment: value }),
      setFixedExpenseReminder: value => set({ fixedExpenseReminder: value }),
      setBudgetExceeded: value => set({ budgetExceeded: value }),
      setMySchedule: value => set({ mySchedule: value }),
      setTogetherSchedule: value => set({ togetherSchedule: value }),
      setAnniversaryReminder: value => set({ anniversaryReminder: value }),
    }),
    {
      name: 'notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
