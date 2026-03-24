import { supabase } from '@/lib/supabase';
import type { Database, Transaction, FixedExpense } from '@/types/database';
import { resolveFixedExpenseDate } from '@/utils/fixed-expense-date';

export type TransactionRow = Transaction & {
  categories: { name: string; icon: string; color: string } | null;
  payment_methods: { name: string } | null;
  assets: { name: string } | null;
  target_assets: { name: string } | null;
};

export type TransactionInput = {
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  tag?: 'me' | 'partner' | 'together' | null;
  memo?: string | null;
  date: string;
  category_id?: string | null;
  payment_method_id?: string | null;
  asset_id?: string | null;
  target_asset_id?: string | null;
  fixed_expense_id?: string | null;
};

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

function toTransactionInsert(
  coupleId: string,
  userId: string,
  input: TransactionInput,
): TransactionInsert {
  return {
    couple_id: coupleId,
    user_id: userId,
    amount: input.amount,
    type: input.type,
    tag: input.tag ?? null,
    memo: input.memo ?? null,
    date: input.date,
    category_id: input.category_id ?? null,
    payment_method_id: input.payment_method_id ?? null,
    asset_id: input.asset_id ?? null,
    target_asset_id: input.target_asset_id ?? null,
    fixed_expense_id: input.fixed_expense_id ?? null,
  };
}

function toTransactionUpdate(input: TransactionInput): TransactionUpdate {
  return {
    amount: input.amount,
    type: input.type,
    tag: input.tag ?? null,
    memo: input.memo ?? null,
    date: input.date,
    category_id: input.category_id ?? null,
    payment_method_id: input.payment_method_id ?? null,
    asset_id: input.asset_id ?? null,
    target_asset_id: input.target_asset_id ?? null,
    fixed_expense_id: input.fixed_expense_id ?? null,
  };
}

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
      '*, categories(name, icon, color), payment_methods(name), assets(name), target_assets:assets!target_asset_id(name)',
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
      '*, categories(name, icon, color), payment_methods(name), assets(name), target_assets:assets!target_asset_id(name)',
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
    .insert(toTransactionInsert(coupleId, userId, input))
    .select(
      '*, categories(name, icon, color), payment_methods(name), assets(name), target_assets:assets!target_asset_id(name)',
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
    .update(toTransactionUpdate(input))
    .eq('id', id)
    .select(
      '*, categories(name, icon, color), payment_methods(name), assets(name), target_assets:assets!target_asset_id(name)',
    )
    .single();
  if (error) throw error;
  return data as unknown as TransactionRow;
}

export async function fetchAssetTransfers(
  assetId: string,
  year: number,
  month: number,
): Promise<TransactionRow[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const selectStr =
    '*, categories(name, icon, color), payment_methods(name), assets(name), target_assets:assets!target_asset_id(name)';

  const [fromResult, toResult] = await Promise.all([
    supabase
      .from('transactions')
      .select(selectStr)
      .eq('asset_id', assetId)
      .eq('type', 'transfer')
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('transactions')
      .select(selectStr)
      .eq('target_asset_id', assetId)
      .eq('type', 'transfer')
      .gte('date', startDate)
      .lte('date', endDate),
  ]);

  if (fromResult.error) throw fromResult.error;
  if (toResult.error) throw toResult.error;

  const merged = [
    ...(fromResult.data ?? []),
    ...(toResult.data ?? []),
  ] as unknown as TransactionRow[];

  return merged.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
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
    .map(({ item, date }) => {
      const isTransfer = item.type === 'transfer';
      return {
        couple_id: coupleId,
        user_id: userId,
        category_id: isTransfer ? null : (item.category_id ?? null),
        amount: item.amount,
        type: (item.type ?? 'expense') as 'expense' | 'transfer',
        tag: 'together' as const,
        date,
        fixed_expense_id: item.id,
        memo: item.name,
        asset_id: isTransfer ? (item.from_asset_id ?? null) : null,
        target_asset_id: isTransfer ? (item.to_asset_id ?? null) : null,
      };
    });
  if (toInsert.length === 0) return;

  const { error } = await supabase.from('transactions').insert(toInsert);
  if (error) throw error;
}

export async function deleteFutureFixedTransactions(
  fixedExpenseId: string,
  fromDate: string,
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('fixed_expense_id', fixedExpenseId)
    .gte('date', fromDate);
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
