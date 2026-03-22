import { supabase } from '@/lib/supabase';

// 이전 달에 동일한 내역명 + 카테고리로 결제된 거래 조회
export async function fetchPrevMonthMatchingTransactions(
  coupleId: string,
  memo: string,
  categoryId: string,
  currentYear: number,
  currentMonth: number, // 0-indexed (JS Date 기준)
): Promise<{ amount: number; date: string }[]> {
  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonthNum = prevDate.getMonth() + 1;
  const startDate = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`;
  const endDate = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-31`;

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, date')
    .eq('couple_id', coupleId)
    .eq('type', 'expense')
    .eq('memo', memo)
    .eq('category_id', categoryId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) return [];
  return data ?? [];
}

// 동일한 이름 + 카테고리로 이미 고정지출이 등록되어 있는지 확인
export async function isAlreadyFixedExpense(
  coupleId: string,
  memo: string,
  categoryId: string | null,
): Promise<boolean> {
  let query = supabase
    .from('fixed_expenses')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('name', memo);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}
