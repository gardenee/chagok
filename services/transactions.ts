import { supabase } from '@/lib/supabase';
import type { Transaction, FixedExpense } from '@/types/database';

export type TransactionRow = Transaction & {
  categories: { name: string; icon: string; color: string } | null;
  payment_methods: { name: string } | null;
  assets: { name: string } | null;
};

export type TransactionInput = {
  amount: number;
  type: 'expense' | 'income';
  tag: 'me' | 'partner' | 'together';
  memo?: string | null;
  date: string;
  category_id?: string | null;
  payment_method_id?: string | null;
  asset_id?: string | null;
  fixed_expense_id?: string | null;
};

export async function fetchMonthTransactions(
  coupleId: string,
  year: number,
  month: number,
): Promise<TransactionRow[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('transactions')
    .select(
      '*, categories(name, icon, color), payment_methods(name), assets(name)',
    )
    .eq('couple_id', coupleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as unknown as TransactionRow[];
}

export async function fetchTransactionById(
  id: string,
): Promise<TransactionRow | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(
      '*, categories(name, icon, color), payment_methods(name), assets(name)',
    )
    .eq('id', id)
    .single();
  if (error) return null;
  return data as unknown as TransactionRow;
}

export async function createTransaction(
  coupleId: string,
  userId: string,
  input: TransactionInput,
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, couple_id: coupleId, user_id: userId })
    .select(
      '*, categories(name, icon, color), payment_methods(name), assets(name)',
    )
    .single();
  if (error) throw error;
  return data as unknown as TransactionRow;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .update(input)
    .eq('id', id)
    .select(
      '*, categories(name, icon, color), payment_methods(name), assets(name)',
    )
    .single();
  if (error) throw error;
  return data as unknown as TransactionRow;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function materializeFixedExpenses(
  coupleId: string,
  userId: string,
  fixedExpenses: FixedExpense[],
  year: number,
  month: number,
): Promise<void> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const m = String(month + 1).padStart(2, '0');
  const candidates = fixedExpenses.filter(fe => fe.due_day <= daysInMonth);
  if (candidates.length === 0) return;

  // 이미 materialized된 항목 조회
  const startDate = `${year}-${m}-01`;
  const endDate = `${year}-${m}-${String(daysInMonth).padStart(2, '0')}`;
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('fixed_expense_id')
    .eq('couple_id', coupleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .not('fixed_expense_id', 'is', null);
  if (fetchError) throw fetchError;

  const existingIds = new Set((existing ?? []).map(t => t.fixed_expense_id));
  const toInsert = candidates
    .filter(fe => !existingIds.has(fe.id))
    .map(fe => ({
      couple_id: coupleId,
      user_id: userId,
      category_id: fe.category_id ?? null,
      amount: fe.amount,
      type: 'expense' as const,
      tag: 'together' as const,
      date: `${year}-${m}-${String(fe.due_day).padStart(2, '0')}`,
      fixed_expense_id: fe.id,
      memo: fe.name,
    }));
  if (toInsert.length === 0) return;

  const { error } = await supabase.from('transactions').insert(toInsert);
  if (error) throw error;
}

export async function updateLinkedTransactions(
  fixedExpenseId: string,
  update: { name?: string; amount?: number; category_id?: string | null },
  fromDate: string,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (update.name !== undefined) payload.memo = update.name;
  if (update.amount !== undefined) payload.amount = update.amount;
  if (update.category_id !== undefined)
    payload.category_id = update.category_id;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('fixed_expense_id', fixedExpenseId)
    .gte('date', fromDate);
  if (error) throw error;
}
