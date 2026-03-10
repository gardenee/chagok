import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

type ColorPillProps = {
  label: string;
  color: string;
  icon?: LucideIcon;
  size?: 'sm' | 'xs';
};

type TagPillProps = {
  tag: 'me' | 'partner' | 'together';
  label: string;
  className?: string;
  bgColor?: string;
};

function getTagBgColor(tag: 'me' | 'partner' | 'together'): string {
  return {
    me: Colors.butter,
    partner: Colors.peach,
    together: Colors.lavender,
  }[tag];
}

export function ColorPill({
  label,
  color,
  icon: Icon,
  size = 'xs',
}: ColorPillProps) {
  return (
    <View
      className='flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-full'
      style={{ backgroundColor: color + '50' }}
    >
      {Icon && <Icon size={10} color={color} strokeWidth={2.5} />}
      <Text className={`font-ibm-semibold text-[10px] text-neutral-700`}>
        {label}
      </Text>
    </View>
  );
}

export function TagPill({
  tag,
  label,
  className = 'px-1.5 py-0.5',
  bgColor,
}: TagPillProps) {
  return (
    <View
      className={`rounded-full ${className}`}
      style={{ backgroundColor: bgColor ?? getTagBgColor(tag) }}
    >
      <Text className='font-ibm-semibold text-[10px] text-neutral-700'>
        {label}
      </Text>
    </View>
  );
}
