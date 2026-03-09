import { supabase } from '../lib/supabase';
import type { FixedExpense } from '../types/database';

export type FixedExpenseInput = {
  name: string;
  amount: number;
  due_day: number;
  category_id?: string | null;
};

export async function fetchFixedExpenses(
  coupleId: string,
): Promise<FixedExpense[]> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .eq('couple_id', coupleId)
    .order('due_day', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createFixedExpense(
  coupleId: string,
  input: FixedExpenseInput,
): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert({ ...input, couple_id: coupleId })
    .select()
    .single();
  if (error) throw error;
  return data as FixedExpense;
}

export async function updateFixedExpense(
  id: string,
  input: Partial<FixedExpenseInput>,
): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FixedExpense;
}

export async function deleteFixedExpense(id: string): Promise<void> {
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
  if (error) throw error;
}
