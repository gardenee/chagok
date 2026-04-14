import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  // 마스터 토글: 사용자가 알림을 켜기/끄기로 선택했는지
  notificationEnabled: boolean;
  // pre-permission 모달을 한 번이라도 보여줬는지 (재설치 시 초기화됨)
  hasShownPermissionModal: boolean;
  partnerTransaction: boolean;
  comment: boolean;
  fixedExpenseReminder: boolean;
  budgetExceeded: boolean;
  mySchedule: boolean;
  togetherSchedule: boolean;
  anniversaryReminder: boolean;
  setNotificationEnabled: (value: boolean) => void;
  setHasShownPermissionModal: (value: boolean) => void;
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
      notificationEnabled: true,
      hasShownPermissionModal: false,
      partnerTransaction: true,
      comment: true,
      fixedExpenseReminder: true,
      budgetExceeded: true,
      mySchedule: true,
      togetherSchedule: true,
      anniversaryReminder: true,
      setNotificationEnabled: value => set({ notificationEnabled: value }),
      setHasShownPermissionModal: value =>
        set({ hasShownPermissionModal: value }),
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
