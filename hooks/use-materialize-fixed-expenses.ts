import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useFixedExpenses } from './use-fixed-expenses';
import { materializeFixedExpenses } from '@/services/transactions';

export function useMaterializeFixedExpenses(year: number, month: number) {
  const { userProfile, session } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const { data: fixedExpenses = [] } = useFixedExpenses();

  useEffect(() => {
    if (!coupleId || !userId || fixedExpenses.length === 0) return;

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    // 과거 달은 materialize 하지 않음
    const isPast =
      year < todayYear || (year === todayYear && month < todayMonth);
    if (isPast) return;

    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    // 이번달 + 다음달 동시 materialize
    Promise.all([
      materializeFixedExpenses(coupleId, userId, fixedExpenses, year, month),
      materializeFixedExpenses(
        coupleId,
        userId,
        fixedExpenses,
        nextYear,
        nextMonth,
      ),
    ])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      })
      .catch(err => {
        console.error('[useMaterializeFixedExpenses]', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, userId, year, month, fixedExpenses.length]);
}
