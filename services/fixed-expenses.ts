import { supabase } from '@/lib/supabase';
import type { FixedExpense } from '@/types/database';

export type FixedExpenseInput = {
  type?: 'expense' | 'transfer';
  name: string;
  amount: number;
  due_day: number;
  due_day_mode: 'day' | 'eom';
  business_day_adjust: 'none' | 'prev' | 'next';
  category_id?: string | null;
  from_asset_id?: string | null;
  to_asset_id?: string | null;
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
  const today = new Date().toISOString().split('T')[0];

  // 오늘 이후 내역 삭제
  const { error: deleteFutureError } = await supabase
    .from('transactions')
    .delete()
    .eq('fixed_expense_id', id)
    .gte('date', today);
  if (deleteFutureError) throw deleteFutureError;

  // 과거 내역은 fixed_expense_id만 null로 변경 (내역 유지)
  const { error: unlinkPastError } = await supabase
    .from('transactions')
    .update({ fixed_expense_id: null })
    .eq('fixed_expense_id', id)
    .lt('date', today);
  if (unlinkPastError) throw unlinkPastError;

  // 고정지출 삭제
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
  if (error) throw error;
}
