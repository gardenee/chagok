import { View, Text } from 'react-native';
import { CircleMinus, ShieldCheck, Landmark } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ItemCard } from '@/components/ui/item-card';
import { IconBox } from '@/components/ui/icon-box';
import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  getAssetTypeOption,
  ASSET_TYPE_OPTIONS,
} from '@/components/assets/asset-payment-form-screen';
import { formatAmount } from '@/utils/format';
import type { Asset } from '@/types/database';

type Props = {
  assets: Asset[];
  isLoading: boolean;
  onEdit: (a: Asset) => void;
  onDelete: (id: string) => void;
};

export function AssetGroups({ assets, isLoading, onEdit, onDelete }: Props) {
  const regularAssets = assets.filter(
    a => a.type !== 'loan' && a.type !== 'insurance',
  );
  const loanAssets = assets.filter(a => a.type === 'loan');
  const insuranceAssets = assets.filter(a => a.type === 'insurance');

  const assetGroups = ASSET_TYPE_OPTIONS.filter(
    t => t.key !== 'loan' && t.key !== 'insurance',
  )
    .map(t => ({
      ...t,
      items: regularAssets.filter(a => a.type === t.key),
    }))
    .filter(g => g.items.length > 0);

  if (isLoading) {
    return <LoadingState className='py-16' />;
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Landmark}
        title='등록된 자산이 없어요'
        description='+ 버튼으로 추가해보세요'
        containerClassName='mx-4 mt-5'
      />
    );
  }

  return (
    <View className='mx-4 mt-5 gap-5'>
      {/* 자산 섹션 */}
      {assetGroups.length > 0 && (
        <View>
          <Text className='font-ibm-bold text-base text-neutral-700 mb-2'>
            자산
          </Text>
          <View className='gap-2'>
            {assetGroups.map(group => {
              const groupTotal = group.items.reduce(
                (s, a) => s + (a.amount ?? 0),
                0,
              );
              return (
                <View key={group.key}>
                  <View className='flex-row items-center justify-between mb-1.5'>
                    <Text className='font-ibm-semibold text-xs text-neutral-500'>
                      {group.label}
                    </Text>
                    <Text className='font-ibm-semibold text-xs text-neutral-500'>
                      {formatAmount(groupTotal)}원
                    </Text>
                  </View>
                  <View className='gap-2'>
                    {group.items.map(a => (
                      <SwipeableDeleteRow
                        key={a.id}
                        onDelete={() => onDelete(a.id)}
                      >
                        <ItemCard onPress={() => onEdit(a)}>
                          <IconBox color={group.color} size='md'>
                            <group.Icon
                              size={20}
                              color={Colors.brown}
                              strokeWidth={2.5}
                            />
                          </IconBox>
                          <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                            {a.name}
                          </Text>
                          <Text className='font-ibm-bold text-base text-neutral-800'>
                            {a.amount != null
                              ? `${formatAmount(a.amount)}원`
                              : ''}
                          </Text>
                        </ItemCard>
                      </SwipeableDeleteRow>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 부채 섹션 */}
      {loanAssets.length > 0 && (
        <View>
          <Text className='font-ibm-bold text-base text-neutral-700 mb-2'>
            부채
          </Text>
          <View className='gap-2'>
            {loanAssets.map(a => (
              <SwipeableDeleteRow key={a.id} onDelete={() => onDelete(a.id)}>
                <ItemCard onPress={() => onEdit(a)}>
                  <IconBox color={getAssetTypeOption('loan').color} size='md'>
                    <CircleMinus
                      size={20}
                      color={Colors.brown}
                      strokeWidth={2.5}
                    />
                  </IconBox>
                  <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                    {a.name}
                  </Text>
                  <Text className='font-ibm-bold text-base text-peach-dark'>
                    {a.amount != null ? `-${formatAmount(a.amount)}원` : ''}
                  </Text>
                </ItemCard>
              </SwipeableDeleteRow>
            ))}
          </View>
        </View>
      )}

      {/* 보험 섹션 */}
      {insuranceAssets.length > 0 && (
        <View>
          <Text className='font-ibm-bold text-base text-neutral-700 mb-2'>
            보험
          </Text>
          <View className='gap-2'>
            {insuranceAssets.map(a => (
              <SwipeableDeleteRow key={a.id} onDelete={() => onDelete(a.id)}>
                <ItemCard onPress={() => onEdit(a)}>
                  <IconBox
                    color={getAssetTypeOption('insurance').color}
                    size='md'
                  >
                    <ShieldCheck
                      size={20}
                      color={Colors.brown}
                      strokeWidth={2.5}
                    />
                  </IconBox>
                  <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                    {a.name}
                  </Text>
                  <Text className='font-ibm-bold text-base text-neutral-800'>
                    {a.amount != null ? `${formatAmount(a.amount)}원` : ''}
                  </Text>
                </ItemCard>
              </SwipeableDeleteRow>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
