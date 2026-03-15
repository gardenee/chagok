import type { FixedExpense } from '@/types/database';

export type BusinessDayAdjust = 'none' | 'prev' | 'next';
export type DueDayMode = 'day' | 'eom';

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function adjustToBusinessDay(date: Date, adjust: BusinessDayAdjust): Date {
  if (adjust === 'none') return date;

  const step = adjust === 'prev' ? -1 : 1;
  const adjusted = new Date(date);
  while (isWeekend(adjusted)) {
    adjusted.setDate(adjusted.getDate() + step);
  }
  return adjusted;
}

export function resolveFixedExpenseDate(
  expense: Pick<
    FixedExpense,
    'due_day' | 'due_day_mode' | 'business_day_adjust'
  >,
  year: number,
  month: number,
): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const baseDay =
    expense.due_day_mode === 'eom'
      ? daysInMonth
      : Math.min(expense.due_day, daysInMonth);

  const anchor = new Date(year, month, baseDay, 9, 0, 0, 0);
  return adjustToBusinessDay(anchor, expense.business_day_adjust);
}
