import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { syncWidgetData } from '@/lib/widget-data';

export function useWidgetSync() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  useEffect(() => {
    if (!coupleId) return;

    syncWidgetData(coupleId);

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncWidgetData(coupleId);
      }
    });

    return () => sub.remove();
  }, [coupleId]);
}
