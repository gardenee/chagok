import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  containerClassName?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  containerClassName = '',
}: EmptyStateProps) {
  return (
    <View
      className={`bg-cream-dark/40 rounded-3xl py-14 items-center ${containerClassName}`}
    >
      <Icon size={32} color={Colors.brownDark} strokeWidth={1.5} />
      <Text className='font-ibm-semibold text-base text-neutral-700 mt-3 mb-1'>
        {title}
      </Text>
      {description ? (
        <Text className='font-ibm-regular text-sm text-neutral-600'>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
