import {
  Landmark,
  Banknote,
  TrendingUp,
  PiggyBank,
  Building2,
  Wallet,
  CircleMinus,
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
  { key: 'bank', label: '은행 계좌', Icon: Landmark, color: '#8ECAE6' },
  { key: 'cash', label: '현금', Icon: Banknote, color: '#95D5B2' },
  { key: 'investment', label: '투자', Icon: TrendingUp, color: '#B8A3DE' },
  { key: 'saving', label: '예적금', Icon: PiggyBank, color: '#FAD97A' },
  { key: 'real_estate', label: '부동산', Icon: Building2, color: '#E9C891' },
  { key: 'vehicle', label: '차량', Icon: Car, color: '#8ECAE6' },
  { key: 'pension', label: '연금', Icon: Sprout, color: '#95D5B2' },
  { key: 'loan', label: '대출', Icon: CircleMinus, color: '#F28482' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#FF85A1' },
];

export function getAssetTypeOption(key: string): AssetTypeOption {
  return (
    ASSET_TYPE_OPTIONS.find(t => t.key === key) ??
    ASSET_TYPE_OPTIONS.find(t => t.key === 'other')!
  );
}

export const ASSET_GROUPS = [{ label: '자산', types: ASSET_TYPE_OPTIONS }];
