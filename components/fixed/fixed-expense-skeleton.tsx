import { View } from 'react-native';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { Shadows } from '@/constants/shadows';

function SkeletonFixedExpenseItem() {
  return (
    <View
      className='bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3.5'
      style={Shadows.primary}
    >
      <SkeletonBox className='w-11 h-11 rounded-2xl' />
      <View className='flex-1 gap-1.5'>
        <SkeletonBox className='w-28 h-4 rounded-lg' />
        <SkeletonBox className='w-36 h-3.5 rounded-lg' />
      </View>
      <SkeletonBox className='w-16 h-4 rounded-lg' />
    </View>
  );
}

export function FixedExpenseSkeleton() {
  return (
    <View className='gap-3'>
      <SkeletonFixedExpenseItem />
      <SkeletonFixedExpenseItem />
      <SkeletonFixedExpenseItem />
    </View>
  );
}
