import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  partnerTransaction: boolean;
  comment: boolean;
  fixedExpenseReminder: boolean;
  setPartnerTransaction: (value: boolean) => void;
  setComment: (value: boolean) => void;
  setFixedExpenseReminder: (value: boolean) => void;
}

export const useNotificationSettingsStore = create<NotificationSettings>()(
  persist(
    set => ({
      partnerTransaction: true,
      comment: true,
      fixedExpenseReminder: true,
      setPartnerTransaction: value => set({ partnerTransaction: value }),
      setComment: value => set({ comment: value }),
      setFixedExpenseReminder: value => set({ fixedExpenseReminder: value }),
    }),
    {
      name: 'notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
