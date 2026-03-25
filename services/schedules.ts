import { supabase } from '@/lib/supabase';
import type { Schedule } from '@/types/database';

export type ScheduleInput = {
  title: string;
  date: string;
  end_date?: string | null;
  start_time?: string | null;
  tag: 'me' | 'partner' | 'together';
};

export async function fetchMonthSchedules(
  coupleId: string,
  year: number,
  month: number,
): Promise<Schedule[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('couple_id', coupleId)
    .lte('date', endDate)
    .or(`and(end_date.is.null,date.gte.${startDate}),end_date.gte.${startDate}`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSchedule(
  coupleId: string,
  userId: string,
  input: ScheduleInput,
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert({ ...input, couple_id: coupleId, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Schedule;
}

export async function updateSchedule(
  id: string,
  input: ScheduleInput,
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchUpcomingSchedules(
  coupleId: string,
): Promise<Schedule[]> {
  const now = new Date();
  const fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  const toDate = `${threeMonthsLater.getFullYear()}-${String(threeMonthsLater.getMonth() + 1).padStart(2, '0')}-${String(threeMonthsLater.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('couple_id', coupleId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true });
  if (error) throw error;
  return data;
}
