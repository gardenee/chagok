import { create } from 'zustand';

export interface FixedExpensePrefill {
  name: string;
  amount: number;
  category_id: string | null;
  due_day: number;
}

interface FixedExpensePrefillStore {
  prefill: FixedExpensePrefill | null;
  setPrefill: (prefill: FixedExpensePrefill) => void;
  clearPrefill: () => void;
}

export const useFixedExpensePrefillStore = create<FixedExpensePrefillStore>()(
  set => ({
    prefill: null,
    setPrefill: prefill => set({ prefill }),
    clearPrefill: () => set({ prefill: null }),
  }),
);
