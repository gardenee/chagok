import { View } from 'react-native';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { Shadows } from '@/constants/shadows';

function SkeletonSummaryCards() {
  return (
    <View className='mx-4 mb-4'>
      <View className='bg-white rounded-3xl px-4 py-3' style={Shadows.primary}>
        <View className='flex-row items-center justify-between px-1 py-3'>
          <SkeletonBox className='w-32 h-4 rounded-lg' />
          <SkeletonBox className='w-20 h-5 rounded-lg' />
        </View>
      </View>
      <View className='flex-row gap-3 mt-3'>
        <View
          className='flex-1 bg-neutral-50 rounded-3xl p-4'
          style={Shadows.card}
        >
          <SkeletonBox className='w-16 h-4 rounded-lg mb-3' />
          <View className='items-end'>
            <SkeletonBox className='w-24 h-7 rounded-lg' />
          </View>
        </View>
        <View
          className='flex-1 bg-neutral-50 rounded-3xl p-4'
          style={Shadows.card}
        >
          <SkeletonBox className='w-16 h-4 rounded-lg mb-3' />
          <View className='items-end'>
            <SkeletonBox className='w-24 h-7 rounded-lg' />
          </View>
        </View>
      </View>
    </View>
  );
}

function SkeletonIncomeCard() {
  return (
    <View className='bg-white rounded-3xl p-4' style={Shadows.primary}>
      <View className='flex-row items-center gap-2.5'>
        <SkeletonBox className='w-10 h-10 rounded-2xl' />
        <SkeletonBox className='flex-1 h-4 rounded-lg' />
        <SkeletonBox className='w-20 h-4 rounded-lg' />
      </View>
    </View>
  );
}

function SkeletonExpenseCard() {
  return (
    <View className='bg-white rounded-3xl p-4' style={Shadows.primary}>
      <View className='flex-row items-center gap-2.5 mb-2'>
        <SkeletonBox className='w-10 h-10 rounded-2xl' />
        <SkeletonBox className='flex-1 h-4 rounded-lg' />
        <SkeletonBox className='w-24 h-4 rounded-lg' />
      </View>
      <View className='flex-row items-center gap-2 mt-1'>
        <SkeletonBox className='flex-1 h-1.5 rounded-full' />
        <SkeletonBox className='w-20 h-6 rounded-full' />
      </View>
    </View>
  );
}

export function BudgetSkeleton() {
  return (
    <>
      <SkeletonSummaryCards />

      <View className='mx-4 mb-6'>
        <SkeletonBox className='w-10 h-5 rounded-lg mb-3.5' />
        <View className='gap-3'>
          <SkeletonIncomeCard />
          <SkeletonIncomeCard />
        </View>
      </View>

      <View className='mx-4'>
        <SkeletonBox className='w-10 h-5 rounded-lg mb-3' />
        <View className='gap-3'>
          <SkeletonExpenseCard />
          <SkeletonExpenseCard />
          <SkeletonExpenseCard />
        </View>
      </View>
    </>
  );
}
