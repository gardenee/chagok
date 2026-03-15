import { supabase } from '@/lib/supabase';
import type { Transaction, FixedExpense } from '@/types/database';
import { resolveFixedExpenseDate } from '@/utils/fixed-expense-date';

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
  if (fixedExpenses.length === 0) return;

  const candidates = fixedExpenses.map(fe => {
    const resolved = resolveFixedExpenseDate(fe, year, month);
    const resolvedY = resolved.getFullYear();
    const resolvedM = String(resolved.getMonth() + 1).padStart(2, '0');
    const resolvedD = String(resolved.getDate()).padStart(2, '0');
    return {
      item: fe,
      date: `${resolvedY}-${resolvedM}-${resolvedD}`,
    };
  });

  // 이미 materialized된 항목 조회
  const sortedDates = [...candidates].map(c => c.date).sort();
  const startDate = sortedDates[0];
  const endDate = sortedDates[sortedDates.length - 1];
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('fixed_expense_id, date')
    .eq('couple_id', coupleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .not('fixed_expense_id', 'is', null);
  if (fetchError) throw fetchError;

  const existingKeys = new Set(
    (existing ?? []).map(t => `${t.fixed_expense_id}|${t.date}`),
  );
  const toInsert = candidates
    .filter(({ item, date }) => !existingKeys.has(`${item.id}|${date}`))
    .map(({ item, date }) => ({
      couple_id: coupleId,
      user_id: userId,
      category_id: item.category_id ?? null,
      amount: item.amount,
      type: 'expense' as const,
      tag: 'together' as const,
      date,
      fixed_expense_id: item.id,
      memo: item.name,
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
