import {
  CreditCard,
  Bus,
  Gift,
  Star,
  Coins,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
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
  { key: 'credit_card', label: '신용카드', Icon: CreditCard, color: '#D4C5F0' },
  { key: 'debit_card', label: '체크카드', Icon: CreditCard, color: '#B5D5F0' },
  { key: 'transit', label: '교통카드', Icon: Bus, color: '#A8D8B0' },
  { key: 'welfare', label: '복지카드', Icon: Gift, color: '#F5D0A0' },
  { key: 'points', label: '포인트', Icon: Star, color: '#FAD97A' },
  { key: 'prepaid', label: '선불', Icon: Coins, color: '#F7B8A0' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#F0C5D5' },
];

export function getPmColor(type: PaymentMethod['type']): string {
  return PM_TYPE_OPTIONS.find(t => t.key === type)?.color ?? '#F0C5D5';
}
