import { View, Text, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '@/hooks/use-assets';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/use-payment-methods';
import {
  AssetPaymentFormScreen,
  type UnifiedFormData,
} from '@/components/assets/asset-payment-form-screen';
import { getAssetTypeOption } from '@/constants/asset-type';
import { getPmColor } from '@/constants/payment-method';
import { AssetGroups } from '@/components/assets/asset-groups';
import { PaymentMethodList } from '@/components/assets/payment-method-list';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SummaryCard } from '@/components/ui/summary-card';
import { formatAmount } from '@/utils/format';
import type { Asset, PaymentMethod } from '@/types/database';

export default function AssetsTab() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { data: assets = [], isLoading } = useAssets();
  const { data: paymentMethods = [], isLoading: pmLoading } =
    usePaymentMethods();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  const [formModal, setFormModal] = useState<{
    visible: boolean;
    editingAsset: Asset | null;
    editingPm: PaymentMethod | null;
  }>({ visible: false, editingAsset: null, editingPm: null });

  const regularAssets = assets.filter(
    a => a.type !== 'loan' && a.type !== 'insurance',
  );
  const loanAssets = assets.filter(a => a.type === 'loan');

  const totalAssets = regularAssets.reduce((s, a) => s + (a.amount ?? 0), 0);
  const totalLoans = loanAssets.reduce((s, a) => s + (a.amount ?? 0), 0);
  const netWorth = totalAssets - totalLoans;

  const isSaving =
    createAsset.isPending ||
    updateAsset.isPending ||
    createPaymentMethod.isPending ||
    updatePaymentMethod.isPending;

  function openCreate() {
    setFormModal({ visible: true, editingAsset: null, editingPm: null });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openEditAsset(a: Asset) {
    setFormModal({ visible: true, editingAsset: a, editingPm: null });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openEditPm(pm: PaymentMethod) {
    setFormModal({ visible: true, editingAsset: null, editingPm: pm });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleFormSave(form: UnifiedFormData) {
    const name = form.name.trim();
    try {
      if (form.category === 'asset') {
        const amount = form.amount
          ? parseInt(form.amount.replace(/[^0-9]/g, ''), 10)
          : null;
        const { color } = getAssetTypeOption(form.type);
        if (formModal.editingAsset) {
          await updateAsset.mutateAsync({
            id: formModal.editingAsset.id,
            name,
            amount,
            type: form.type,
            icon: form.type,
            color,
          });
        } else {
          await createAsset.mutateAsync({
            name,
            amount,
            type: form.type,
            icon: form.type,
            color,
            sort_order: assets.length,
          });
        }
      } else {
        const limit = form.limit
          ? parseInt(form.limit.replace(/[^0-9]/g, ''), 10)
          : null;
        const annualFee = form.annual_fee
          ? parseInt(form.annual_fee.replace(/[^0-9]/g, ''), 10)
          : null;
        const pmType = form.type as PaymentMethod['type'];
        const color = getPmColor(pmType);
        const pmExtra = {
          card_company: form.card_company || null,
          billing_day: form.billing_day,
          annual_fee: annualFee,
          linked_asset_id: form.linked_asset_id,
        };
        if (formModal.editingPm) {
          await updatePaymentMethod.mutateAsync({
            id: formModal.editingPm.id,
            name,
            type: pmType,
            color,
            limit,
            ...pmExtra,
          });
        } else {
          await createPaymentMethod.mutateAsync({
            name,
            type: pmType,
            color,
            limit,
            sort_order: paymentMethods.length,
            ...pmExtra,
          });
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFormModal(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleDeleteAsset(id?: string) {
    const targetId = id ?? formModal.editingAsset?.id;
    if (!targetId) return;
    Alert.alert('자산 삭제', '이 자산을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsset.mutateAsync(targetId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setFormModal(s => ({ ...s, visible: false }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  function handleDeletePm(id?: string) {
    const targetId = id ?? formModal.editingPm?.id;
    if (!targetId) return;
    Alert.alert('결제수단 삭제', '이 결제수단을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePaymentMethod.mutateAsync(targetId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setFormModal(s => ({ ...s, visible: false }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ScreenHeader title='자산' onAdd={openCreate} />

        <SummaryCard
          label='순 자산'
          amount={netWorth}
          subtext={`자산 ${formatAmount(totalAssets)}원 · 부채 ${formatAmount(totalLoans)}원`}
        />

        {/* 자산 */}
        <AssetGroups
          assets={assets}
          isLoading={isLoading}
          onEdit={openEditAsset}
          onDelete={handleDeleteAsset}
        />

        {/* 결제수단 섹션 */}
        <View className='mx-4 mt-8'>
          <Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
            결제수단
          </Text>
          <PaymentMethodList
            paymentMethods={paymentMethods}
            isLoading={pmLoading}
            onEdit={openEditPm}
            onDelete={handleDeletePm}
          />
        </View>
      </ScrollView>

      <AssetPaymentFormScreen
        visible={formModal.visible}
        editingAsset={formModal.editingAsset}
        editingPm={formModal.editingPm}
        isSaving={isSaving}
        bankAssets={assets.filter(a => a.type === 'bank')}
        onClose={() => setFormModal(s => ({ ...s, visible: false }))}
        onSave={handleFormSave}
        onDeleteAsset={formModal.editingAsset ? handleDeleteAsset : undefined}
        onDeletePm={formModal.editingPm ? handleDeletePm : undefined}
      />
    </SafeAreaView>
  );
}
