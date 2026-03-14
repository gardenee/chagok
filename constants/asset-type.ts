import {
  Landmark,
  Banknote,
  TrendingUp,
  PiggyBank,
  Building2,
  Wallet,
  CircleMinus,
  ShieldCheck,
  Car,
  Sprout,
  type LucideIcon,
} from 'lucide-react-native';

export type AssetTypeOption = {
  key: string;
  label: string;
  Icon: LucideIcon;
  color: string;
};

export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  { key: 'bank', label: '은행 계좌', Icon: Landmark, color: '#B5D5F0' },
  { key: 'cash', label: '현금', Icon: Banknote, color: '#A8D8B0' },
  { key: 'investment', label: '투자', Icon: TrendingUp, color: '#D4C5F0' },
  { key: 'saving', label: '예적금', Icon: PiggyBank, color: '#FAD97A' },
  { key: 'real_estate', label: '부동산', Icon: Building2, color: '#F5D0A0' },
  { key: 'vehicle', label: '차량', Icon: Car, color: '#B5D5F0' },
  { key: 'pension', label: '연금', Icon: Sprout, color: '#A8D8B0' },
  { key: 'loan', label: '대출', Icon: CircleMinus, color: '#F4A0A0' },
  { key: 'insurance', label: '보험', Icon: ShieldCheck, color: '#B5D5F0' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#F0C5D5' },
];

export function getAssetTypeOption(key: string): AssetTypeOption {
  return (
    ASSET_TYPE_OPTIONS.find(t => t.key === key) ??
    ASSET_TYPE_OPTIONS.find(t => t.key === 'other')!
  );
}

export const ASSET_GROUPS = [{ label: '자산', types: ASSET_TYPE_OPTIONS }];
