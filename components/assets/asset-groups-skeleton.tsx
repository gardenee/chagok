import { View } from 'react-native';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { Shadows } from '@/constants/shadows';

function SkeletonAssetItem() {
  return (
    <View
      className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
      style={Shadows.primary}
    >
      <SkeletonBox className='w-11 h-11 rounded-2xl' />
      <SkeletonBox className='flex-1 h-4 rounded-lg' />
      <SkeletonBox className='w-20 h-4 rounded-lg' />
    </View>
  );
}

export function AssetGroupsSkeleton() {
  return (
    <View className='mx-4 mt-5 gap-6'>
      <View>
        <SkeletonBox className='w-10 h-6 rounded-lg mb-3' />
        <View className='mb-2.5 px-1 flex-row items-center justify-between'>
          <SkeletonBox className='w-16 h-4 rounded-lg' />
          <SkeletonBox className='w-16 h-4 rounded-lg' />
        </View>
        <View className='gap-2.5'>
          <SkeletonAssetItem />
          <SkeletonAssetItem />
        </View>
      </View>
      <View>
        <View className='mb-2.5 px-1 flex-row items-center justify-between'>
          <SkeletonBox className='w-16 h-4 rounded-lg' />
          <SkeletonBox className='w-16 h-4 rounded-lg' />
        </View>
        <View className='gap-2.5'>
          <SkeletonAssetItem />
        </View>
      </View>
    </View>
  );
}
