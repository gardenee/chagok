import { Wallet } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ICON_MAP } from '@/constants/icon-map';

type Props = {
  iconKey: string;
  color: string;
  size?: number;
};

export function CategoryIcon({ iconKey, color, size = 18 }: Props) {
  const Icon: LucideIcon = ICON_MAP[iconKey] ?? Wallet;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
}
