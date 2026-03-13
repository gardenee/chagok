import type { CategoryFormData } from '@/components/budget/category-form-screen';
import type { PaymentMethodFormData } from '@/components/assets/payment-method-form-screen';

export type TxFormData = {
  amount: string;
  type: 'expense' | 'income';
  tag: 'me' | 'partner' | 'together';
  memo: string;
  category_id: string | null;
  payment_method_id: string | null;
  asset_id: string | null;
};

export type ScheduleFormData = {
  title: string;
  tag: 'me' | 'partner' | 'together';
  time: string | null;
};

export type TxModalState = {
  visible: boolean;
  editingId: string | null;
  form: TxFormData;
  view: 'tx' | 'catMgmt' | 'catForm' | 'pmMgmt' | 'pmForm';
  catEditingId: string | null;
  catCategoryType: 'expense' | 'income';
  catForm: CategoryFormData;
  catFormSource: 'tx' | 'catMgmt';
  pmEditingId: string | null;
  pmForm: PaymentMethodFormData;
  detachFixed: boolean;
};

export type ScheduleModalState = {
  visible: boolean;
  editingId: string | null;
  form: ScheduleFormData;
};

export type FixedModalState = {
  visible: boolean;
  editingId: string | null;
  form: { name: string; amount: string; due_day: number };
};

export interface DayCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export type TagOption = {
  value: 'me' | 'partner' | 'together';
  label: string;
};

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const INITIAL_TX_FORM: TxFormData = {
  amount: '',
  type: 'expense',
  tag: 'me',
  memo: '',
  category_id: null,
  payment_method_id: null,
  asset_id: null,
};

export const INITIAL_SCHEDULE_FORM: ScheduleFormData = {
  title: '',
  tag: 'me',
  time: null,
};

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getTagBgColor(tag: 'me' | 'partner' | 'together'): string {
  return { me: '#FAD97A', partner: '#F7B8A0', together: '#D4C5F0' }[tag];
}

export function getSelectedDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}
