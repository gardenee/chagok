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

type TagType = 'me' | 'partner' | 'together' | 'holiday';

type TagPillProps = {
  tag: TagType;
  label: string;
  bgColor?: string;
  className?: string;
};

function getTagColor(tag: TagType): string {
  return {
    me: Colors.butter,
    partner: Colors.peach,
    together: Colors.lavender,
    holiday: Colors.peachDark,
  }[tag];
}

export function Pill({
  label,
  color,
  icon: Icon,
  solid = false,
  className = 'px-2 py-1',
}: PillProps) {
  return (
    <View
      className={`flex-row items-center gap-1 rounded-full ${className}`}
      style={{ backgroundColor: solid ? color : color + '50' }}
    >
      {Icon && <Icon size={11} color={color} strokeWidth={2.5} />}
      <Text className='font-ibm-semibold text-xs text-neutral-700'>
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
