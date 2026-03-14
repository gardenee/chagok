import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useFixedExpenses } from './use-fixed-expenses';
import { useCouple } from './use-couple';
import { materializeFixedExpenses } from '@/services/transactions';
import { updateLastMaterializedMonth } from '@/services/couple';

export function useMaterializeFixedExpenses() {
  const { userProfile, session } = useAuthStore();
  const coupleId = userProfile?.couple_id ?? null;
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const { data: fixedExpenses = [] } = useFixedExpenses();
  const { data: couple } = useCouple();

  useEffect(() => {
    if (!coupleId || !userId || !couple) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // 이미 이번달 처리됐으면 스킵 (무한루프 방지)
    if (couple.last_materialized_month === currentMonthStr) return;

    // 처리할 달 목록 계산
    const monthsToProcess: Array<{ year: number; month: number }> = [];

    if (!couple.last_materialized_month) {
      // 처음 실행: 이번달만
      monthsToProcess.push({ year: currentYear, month: currentMonth });
    } else {
      // 마지막 처리 달 다음 달부터 이번달까지 순서대로
      const [lastY, lastM] = couple.last_materialized_month
        .split('-')
        .map(Number);
      let y = lastY;
      let m = lastM; // 1-indexed
      while (true) {
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
        monthsToProcess.push({ year: y, month: m - 1 }); // month: 0-indexed
        if (y === currentYear && m - 1 === currentMonth) break;
      }
    }

    // 다음달 항상 포함 (선처리)
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    monthsToProcess.push({ year: nextYear, month: nextMonth });

    const run = async () => {
      if (fixedExpenses.length > 0) {
        await Promise.all(
          monthsToProcess.map(({ year, month }) =>
            materializeFixedExpenses(
              coupleId,
              userId,
              fixedExpenses,
              year,
              month,
            ),
          ),
        );
      }
      await updateLastMaterializedMonth(coupleId, currentMonthStr);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['couple', coupleId] });
    };

    run().catch(err => {
      console.error('[useMaterializeFixedExpenses]', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, userId, couple?.last_materialized_month, fixedExpenses.length]);
}
