import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowLeftRight, Pencil } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { useAssets, useUpdateAsset, useDeleteAsset } from '@/hooks/use-assets';
import { useAssetTransfers } from '@/hooks/use-transactions';
import { getAssetTypeOption } from '@/constants/asset-type';
import { formatAmount } from '@/utils/format';
import { MonthNavigator } from '@/components/budget/month-navigator';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AssetPaymentFormScreen,
  type UnifiedFormData,
} from '@/components/assets/asset-payment-form-screen';
import { getPmColor } from '@/constants/payment-method';
import type { TransactionRow } from '@/hooks/use-transactions';

export default function AssetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: assets = [] } = useAssets();
  const asset = assets.find(a => a.id === id);

  const { data: transfers = [], isLoading } = useAssetTransfers(
    id!,
    year,
    month,
  );

  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [editVisible, setEditVisible] = useState(false);

  const totalIn = useMemo(
    () =>
      transfers
        .filter(t => t.target_asset_id === id)
        .reduce((s, t) => s + t.amount, 0),
    [transfers, id],
  );

  const totalOut = useMemo(
    () =>
      transfers
        .filter(t => t.asset_id === id)
        .reduce((s, t) => s + t.amount, 0),
    [transfers, id],
  );

  function prevMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else setMonth(m => m - 1);
  }

  function nextMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else setMonth(m => m + 1);
  }

  async function handleEditSave(form: UnifiedFormData) {
    if (!asset) return;
    const name = form.name.trim();
    try {
      const amount = form.amount
        ? parseInt(form.amount.replace(/[^0-9]/g, ''), 10)
        : null;
      const { color } = getAssetTypeOption(form.type);
      await updateAsset.mutateAsync({
        id: asset.id,
        name,
        amount,
        type: form.type,
        icon: form.type,
        color,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditVisible(false);
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleDelete() {
    if (!asset) return;
    Alert.alert('자산 삭제', '이 자산을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsset.mutateAsync(asset.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  const typeOption = asset ? getAssetTypeOption(asset.type) : null;

  if (!asset) {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <View className='px-6 pt-6'>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon={ArrowLeftRight}
          title='자산을 찾을 수 없어요'
          containerClassName='mx-4 mt-8'
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 헤더 */}
        <View className='flex-row items-center gap-3 px-6 pt-6 pb-2'>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className='font-ibm-bold text-2xl text-brown-darker flex-1'>
            {asset.name}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditVisible(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Pencil size={18} color={Colors.neutralLight} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 요약 카드 */}
        <View
          className='mx-4 mt-2 mb-4 rounded-3xl p-5 bg-cream-dark'
          style={Shadows.card}
        >
          <Text className='font-ibm-semibold text-base text-neutral-700 mb-0.5'>
            현재 잔액
          </Text>
          <Text className='font-ibm-bold text-4xl leading-[44px] mb-4 text-brown-darker'>
            {asset.amount != null ? `${formatAmount(asset.amount)}원` : '—'}
          </Text>
          <View className='flex-row gap-6'>
            <View>
              <Text className='font-ibm-regular text-sm text-neutral-500 mb-1'>
                이번 달 입금
              </Text>
              <Text className='font-ibm-bold text-xl text-olive-darker'>
                +{formatAmount(totalIn)}원
              </Text>
            </View>
            <View>
              <Text className='font-ibm-regular text-sm text-neutral-500 mb-1'>
                이번 달 출금
              </Text>
              <Text className='font-ibm-bold text-xl text-peach-darker'>
                -{formatAmount(totalOut)}원
              </Text>
            </View>
          </View>
        </View>

        {/* 월 네비게이터 */}
        <MonthNavigator
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          className='pt-3 pb-5'
        />

        {/* 이체 내역 */}
        <View className='mx-4 gap-3'>
          {isLoading ? (
            <LoadingState />
          ) : transfers.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title='이체 내역이 없어요'
              description='이 자산의 이체 내역이 없습니다'
            />
          ) : (
            transfers.map(t => (
              <TransferItem key={t.id} transaction={t} assetId={id!} />
            ))
          )}
        </View>
      </ScrollView>

      <AssetPaymentFormScreen
        visible={editVisible}
        editingAsset={asset}
        editingPm={null}
        isSaving={updateAsset.isPending}
        bankAssets={assets.filter(a => a.type === 'bank')}
        onClose={() => setEditVisible(false)}
        onSave={handleEditSave}
        onDeleteAsset={handleDelete}
        onDeletePm={undefined}
      />
    </SafeAreaView>
  );
}

function TransferItem({
  transaction: t,
  assetId,
}: {
  transaction: TransactionRow;
  assetId: string;
}) {
  const isIncoming = t.target_asset_id === assetId;
  const otherAssetName = isIncoming
    ? (t.assets?.name ?? '—')
    : (t.target_assets?.name ?? '—');

  return (
    <View
      className='bg-white rounded-3xl px-4 py-5 flex-row items-center gap-3'
      style={Shadows.primary}
    >
      {/* 날짜 */}
      <Text className='font-ibm-regular text-sm text-neutral-600 w-11 shrink-0'>
        {t.date.slice(5).replace('-', '.')}
      </Text>

      {/* 메모 + 상대 자산 */}
      <View className='flex-1'>
        <Text
          className='font-ibm-semibold text-base text-neutral-800'
          numberOfLines={1}
        >
          {t.memo ||
            (isIncoming ? `${otherAssetName}에서` : `${otherAssetName}으로`)}
        </Text>
        <Text className='font-ibm-regular text-xs text-neutral-500 mt-0.5'>
          {isIncoming ? `← ${otherAssetName}` : `→ ${otherAssetName}`}
        </Text>
      </View>

      {/* 금액 */}
      <Text
        className='font-ibm-bold text-base shrink-0'
        style={{ color: isIncoming ? Colors.oliveDark : Colors.brownDarker }}
      >
        {isIncoming ? '+' : '-'}
        {formatAmount(t.amount)}원
      </Text>
    </View>
  );
}
