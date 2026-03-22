import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface IgnoredKey {
  memo: string;
  category_id: string | null;
}

interface RecurringSuggestionStore {
  ignoredKeys: IgnoredKey[];
  addIgnored: (key: IgnoredKey) => void;
  isIgnored: (key: IgnoredKey) => boolean;
  clearAll: () => void;
}

export const useRecurringSuggestionStore = create<RecurringSuggestionStore>()(
  persist(
    (set, get) => ({
      ignoredKeys: [],
      addIgnored: key => set(s => ({ ignoredKeys: [...s.ignoredKeys, key] })),
      isIgnored: key =>
        get().ignoredKeys.some(
          k =>
            k.memo.toLowerCase() === key.memo.toLowerCase() &&
            k.category_id === key.category_id,
        ),
      clearAll: () => set({ ignoredKeys: [] }),
    }),
    {
      name: 'recurring-suggestion-ignored',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
