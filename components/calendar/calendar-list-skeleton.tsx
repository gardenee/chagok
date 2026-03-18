import { View } from 'react-native';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { Shadows } from '@/constants/shadows';

function SkeletonTransactionItem() {
  return (
    <View
      className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
      style={Shadows.primary}
    >
      <SkeletonBox className='w-10 h-10 rounded-2xl' />
      <View className='flex-1 gap-1.5'>
        <SkeletonBox className='w-32 h-4 rounded-lg' />
        <View className='flex-row gap-1.5'>
          <SkeletonBox className='w-14 h-4 rounded-full' />
          <SkeletonBox className='w-10 h-4 rounded-full' />
        </View>
      </View>
      <SkeletonBox className='w-16 h-4 rounded-lg' />
    </View>
  );
}

function SkeletonScheduleItem() {
  return (
    <View
      className='bg-white rounded-3xl px-4 py-5 flex-row items-center gap-3'
      style={Shadows.primary}
    >
      <SkeletonBox className='w-12 h-5 rounded-full' />
      <SkeletonBox className='flex-1 h-4 rounded-lg' />
    </View>
  );
}

type Props = {
  type?: 'ledger' | 'schedule';
};

export function CalendarListSkeleton({ type = 'ledger' }: Props) {
  if (type === 'schedule') {
    return (
      <View className='gap-2.5'>
        <SkeletonScheduleItem />
        <SkeletonScheduleItem />
        <SkeletonScheduleItem />
      </View>
    );
  }

  return (
    <View className='gap-5'>
      <View>
        <SkeletonBox className='w-8 h-4 rounded-lg mb-2 ml-1' />
        <View className='gap-2.5'>
          <SkeletonTransactionItem />
          <SkeletonTransactionItem />
        </View>
      </View>
      <View>
        <SkeletonBox className='w-8 h-4 rounded-lg mb-2 ml-1' />
        <View className='gap-2.5'>
          <SkeletonTransactionItem />
        </View>
      </View>
    </View>
  );
}
