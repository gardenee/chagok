import { CreditCard, Bus, Wallet, type LucideIcon } from 'lucide-react-native';
import type { PaymentMethod } from '@/types/database';

export type PaymentMethodFormData = {
  name: string;
  type: PaymentMethod['type'];
};

export const INITIAL_PM_FORM: PaymentMethodFormData = {
  name: '',
  type: 'credit_card',
};

export type PmTypeOption = {
  key: PaymentMethod['type'];
  label: string;
  color: string;
  Icon: LucideIcon;
};

export const PM_TYPE_OPTIONS: PmTypeOption[] = [
  { key: 'credit_card', label: '신용카드', Icon: CreditCard, color: '#B8A3DE' },
  { key: 'debit_card', label: '체크카드', Icon: CreditCard, color: '#8ECAE6' },
  { key: 'transit', label: '교통카드', Icon: Bus, color: '#95D5B2' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#FF85A1' },
];

export function getPmColor(type: PaymentMethod['type']): string {
  return PM_TYPE_OPTIONS.find(t => t.key === type)?.color ?? '#F0C5D5';
}
