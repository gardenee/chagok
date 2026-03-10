import { supabase } from '../lib/supabase';
import type { Schedule } from '../types/database';

export type ScheduleInput = {
  title: string;
  date: string;
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
    .gte('date', startDate)
    .lte('date', endDate)
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
