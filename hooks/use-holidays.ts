import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchMonthHolidays } from '@/services/holidays';

export function useMonthHolidays(year: number, month: number) {
  const query = useQuery({
    queryKey: ['holidays', year, month],
    queryFn: () => fetchMonthHolidays(year, month),
    staleTime: Infinity, // 공휴일은 변하지 않음
  });

  const holidaysByDate = useMemo(() => {
    const map: Record<string, string> = {};
    for (const h of query.data ?? []) {
      map[h.date] = h.name;
    }
    return map;
  }, [query.data]);

  return { ...query, holidaysByDate };
}
