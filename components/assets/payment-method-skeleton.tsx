import { View } from 'react-native';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { Shadows } from '@/constants/shadows';

function SkeletonPaymentMethodItem() {
  return (
    <View
      className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
      style={Shadows.primary}
    >
      <SkeletonBox className='w-11 h-11 rounded-2xl' />
      <View className='flex-1 gap-1.5'>
        <SkeletonBox className='w-28 h-4 rounded-lg' />
        <SkeletonBox className='w-36 h-3.5 rounded-lg' />
      </View>
    </View>
  );
}

export function PaymentMethodSkeleton() {
  return (
    <View className='gap-2.5'>
      <SkeletonPaymentMethodItem />
      <SkeletonPaymentMethodItem />
      <SkeletonPaymentMethodItem />
    </View>
  );
}
