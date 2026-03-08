import { supabase } from '../lib/supabase';
import type { Transaction } from '../types/database';

export type TransactionRow = Transaction & {
  categories: { name: string } | null;
};

export type TransactionInput = {
  amount: number;
  type: 'expense' | 'income';
  tag: 'me' | 'partner' | 'together';
  memo?: string | null;
  date: string;
  category_id?: string | null;
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
    .select('*, categories(name)')
    .eq('couple_id', coupleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as TransactionRow[];
}

export async function createTransaction(
  coupleId: string,
  userId: string,
  input: TransactionInput,
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, couple_id: coupleId, user_id: userId })
    .select('*, categories(name)')
    .single();
  if (error) throw error;
  return data as TransactionRow;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .update(input)
    .eq('id', id)
    .select('*, categories(name)')
    .single();
  if (error) throw error;
  return data as TransactionRow;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
