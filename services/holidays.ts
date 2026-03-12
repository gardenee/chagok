import { supabase } from '@/lib/supabase';
import type { Holiday } from '@/types/database';

export async function fetchMonthHolidays(
  year: number,
  month: number,
): Promise<Holiday[]> {
  const m = String(month + 1).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();
  const from = `${year}-${m}-01`;
  const to = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('holidays')
    .select('date, name, is_substitute')
    .gte('date', from)
    .lte('date', to);

  if (error) throw error;
  return data ?? [];
}
