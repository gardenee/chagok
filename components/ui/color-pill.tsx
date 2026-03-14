import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

type PillProps = {
  label: string;
  color: string;
  icon?: LucideIcon;
  solid?: boolean;
  className?: string;
};

type TagPillProps = {
  tag: 'me' | 'partner' | 'together';
  label: string;
  bgColor?: string;
  className?: string;
};

function getTagColor(tag: 'me' | 'partner' | 'together'): string {
  return {
    me: Colors.butter,
    partner: Colors.peach,
    together: Colors.lavender,
  }[tag];
}

export function Pill({
  label,
  color,
  icon: Icon,
  solid = false,
  className = 'px-1.5 py-0.5',
}: PillProps) {
  return (
    <View
      className={`flex-row items-center gap-0.5 rounded-full ${className}`}
      style={{ backgroundColor: solid ? color : color + '50' }}
    >
      {Icon && <Icon size={10} color={color} strokeWidth={2.5} />}
      <Text className='font-ibm-semibold text-[10px] text-neutral-700'>
        {label}
      </Text>
    </View>
  );
}

export function ColorPill({
  label,
  color,
  icon,
}: Omit<PillProps, 'className'>) {
  return <Pill label={label} color={color} icon={icon} />;
}

export function TagPill({ tag, label, bgColor, className }: TagPillProps) {
  return (
    <Pill
      label={label}
      color={bgColor ?? getTagColor(tag)}
      solid
      className={className}
    />
  );
}
