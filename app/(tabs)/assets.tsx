import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useState } from 'react';
import {
  Landmark,
  Banknote,
  TrendingUp,
  PiggyBank,
  Building2,
  Wallet,
  CircleMinus,
  ShieldCheck,
  CreditCard,
  Bus,
  Gift,
  Coins,
  Star,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '../../hooks/use-assets';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '../../hooks/use-payment-methods';
import { EmptyState } from '../../components/ui/empty-state';
import {
  BottomSheet,
  BottomSheetHeader,
} from '../../components/ui/bottom-sheet';
import { SaveButton } from '../../components/ui/save-button';
import { ModalTextInput, AmountInput } from '../../components/ui/modal-inputs';
import { ScreenHeader } from '../../components/ui/screen-header';
import { SummaryCard } from '../../components/ui/summary-card';
import { ItemCard } from '../../components/ui/item-card';
import { LoadingState } from '../../components/ui/loading-state';
import { SwipeableDeleteRow } from '../../components/ui/swipeable-delete-row';
import type { Asset, PaymentMethod } from '../../types/database';

type AssetType = {
  key: string;
  label: string;
  Icon: LucideIcon;
  color: string;
  isLiability?: boolean;
};

const ASSET_TYPES: AssetType[] = [
  { key: 'bank', label: '은행 계좌', Icon: Landmark, color: '#B5D5F0' },
  { key: 'cash', label: '현금', Icon: Banknote, color: '#A8D8B0' },
  { key: 'investment', label: '주식/펀드', Icon: TrendingUp, color: '#D4C5F0' },
  { key: 'saving', label: '적금/예금', Icon: PiggyBank, color: '#FAD97A' },
  { key: 'real_estate', label: '부동산', Icon: Building2, color: '#F5D0A0' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#F0C5D5' },
  {
    key: 'loan',
    label: '대출',
    Icon: CircleMinus,
    color: '#F4A0A0',
    isLiability: true,
  },
  {
    key: 'insurance',
    label: '보험',
    Icon: ShieldCheck,
    color: '#B5D5F0',
    isLiability: false,
  },
];

type PaymentMethodType = {
  key: PaymentMethod['type'];
  label: string;
  Icon: LucideIcon;
  color: string;
};

const PAYMENT_METHOD_TYPES: PaymentMethodType[] = [
  { key: 'credit_card', label: '신용카드', Icon: CreditCard, color: '#D4C5F0' },
  { key: 'debit_card', label: '체크카드', Icon: CreditCard, color: '#B5D5F0' },
  { key: 'transit', label: '교통카드', Icon: Bus, color: '#A8D8B0' },
  { key: 'welfare', label: '복지카드', Icon: Gift, color: '#F5D0A0' },
  { key: 'points', label: '포인트', Icon: Star, color: '#FAD97A' },
  { key: 'prepaid', label: '선불', Icon: Coins, color: '#F7B8A0' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#F0C5D5' },
];

function getAssetType(key: string): AssetType {
  return (
    ASSET_TYPES.find(t => t.key === key) ?? ASSET_TYPES[ASSET_TYPES.length - 3]
  );
}

function getPaymentMethodType(key: PaymentMethod['type']): PaymentMethodType {
  return (
    PAYMENT_METHOD_TYPES.find(t => t.key === key) ??
    PAYMENT_METHOD_TYPES[PAYMENT_METHOD_TYPES.length - 1]
  );
}

function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR');
}

type FormData = {
  name: string;
  amount: string;
  type: string;
};

type PaymentFormData = {
  name: string;
  type: PaymentMethod['type'];
};

const INITIAL_FORM: FormData = { name: '', amount: '', type: 'bank' };
const INITIAL_PAYMENT_FORM: PaymentFormData = { name: '', type: 'credit_card' };

export default function AssetsTab() {
  const { data: assets = [], isLoading } = useAssets();
  const { data: paymentMethods = [], isLoading: pmLoading } =
    usePaymentMethods();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  const [modal, setModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: FormData;
  }>({
    visible: false,
    editingId: null,
    form: INITIAL_FORM,
  });

  const [paymentModal, setPaymentModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: PaymentFormData;
  }>({
    visible: false,
    editingId: null,
    form: INITIAL_PAYMENT_FORM,
  });

  const regularAssets = assets.filter(
    a => a.type !== 'loan' && a.type !== 'insurance',
  );
  const loanAssets = assets.filter(a => a.type === 'loan');
  const insuranceAssets = assets.filter(a => a.type === 'insurance');

  const totalAssets = regularAssets.reduce((s, a) => s + a.amount, 0);
  const totalLoans = loanAssets.reduce((s, a) => s + a.amount, 0);
  const netWorth = totalAssets - totalLoans;

  const isSaving = createAsset.isPending || updateAsset.isPending;
  const isPaymentSaving =
    createPaymentMethod.isPending || updatePaymentMethod.isPending;

  function openCreate() {
    setModal({ visible: true, editingId: null, form: INITIAL_FORM });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openEdit(a: Asset) {
    setModal({
      visible: true,
      editingId: a.id,
      form: { name: a.name, amount: String(a.amount), type: a.type },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSave() {
    const name = modal.form.name.trim();
    const amount = parseInt(modal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (!name) {
      Alert.alert('입력 오류', '자산 이름을 입력해주세요');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      Alert.alert('입력 오류', '금액을 올바르게 입력해주세요');
      return;
    }
    const type = modal.form.type;
    const { color } = getAssetType(type);
    try {
      if (modal.editingId) {
        await updateAsset.mutateAsync({
          id: modal.editingId,
          name,
          amount,
          type,
          icon: type,
          color,
        });
      } else {
        await createAsset.mutateAsync({
          name,
          amount,
          type,
          icon: type,
          color,
          sort_order: assets.length,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleDelete(id: string) {
    Alert.alert('자산 삭제', '이 자산을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsset.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setModal(s => ({ ...s, visible: false }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  function openPaymentCreate() {
    setPaymentModal({
      visible: true,
      editingId: null,
      form: INITIAL_PAYMENT_FORM,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openPaymentEdit(pm: PaymentMethod) {
    setPaymentModal({
      visible: true,
      editingId: pm.id,
      form: { name: pm.name, type: pm.type },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handlePaymentSave() {
    const name = paymentModal.form.name.trim();
    if (!name) {
      Alert.alert('입력 오류', '결제수단 이름을 입력해주세요');
      return;
    }
    const pmType = getPaymentMethodType(paymentModal.form.type);
    try {
      if (paymentModal.editingId) {
        await updatePaymentMethod.mutateAsync({
          id: paymentModal.editingId,
          name,
          type: paymentModal.form.type,
          color: pmType.color,
        });
      } else {
        await createPaymentMethod.mutateAsync({
          name,
          type: paymentModal.form.type,
          color: pmType.color,
          sort_order: paymentMethods.length,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPaymentModal(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handlePaymentDelete(id: string) {
    Alert.alert('결제수단 삭제', '이 결제수단을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePaymentMethod.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPaymentModal(s => ({ ...s, visible: false }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  // 자산 그룹핑 (대출/보험 제외)
  const assetGroups = ASSET_TYPES.filter(
    t => t.key !== 'loan' && t.key !== 'insurance',
  )
    .map(t => ({
      ...t,
      items: regularAssets.filter(a => a.type === t.key),
    }))
    .filter(g => g.items.length > 0);

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ScreenHeader title='자산' onAdd={openCreate} />

        <SummaryCard
          label='순 자산'
          amount={netWorth}
          subtext={`자산 ${formatAmount(totalAssets)}원 · 대출 ${formatAmount(totalLoans)}원`}
        />

        {/* 자산 */}
        {isLoading ? (
          <LoadingState className='py-16' />
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title='등록된 자산이 없어요'
            description='+ 버튼으로 추가해보세요'
            containerClassName='mx-4 mt-5'
          />
        ) : (
          <View className='mx-4 mt-5 gap-5'>
            {/* 자산 섹션 */}
            {assetGroups.length > 0 && (
              <View>
                <Text className='font-ibm-bold text-xs text-neutral-500 mb-2'>
                  자산
                </Text>
                <View className='gap-2'>
                  {assetGroups.map(group => {
                    const groupTotal = group.items.reduce(
                      (s, a) => s + a.amount,
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
                              onDelete={() => handleDelete(a.id)}
                            >
                              <ItemCard onPress={() => openEdit(a)}>
                                <View
                                  className='w-11 h-11 rounded-2xl items-center justify-center'
                                  style={{
                                    backgroundColor: group.color + '80',
                                  }}
                                >
                                  <group.Icon
                                    size={20}
                                    color={Colors.brown}
                                    strokeWidth={2.5}
                                  />
                                </View>
                                <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                                  {a.name}
                                </Text>
                                <Text className='font-ibm-bold text-base text-neutral-800'>
                                  {formatAmount(a.amount)}원
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
                <Text className='font-ibm-bold text-xs text-neutral-500 mb-2'>
                  부채
                </Text>
                <View className='gap-2'>
                  {loanAssets.map(a => (
                    <SwipeableDeleteRow
                      key={a.id}
                      onDelete={() => handleDelete(a.id)}
                    >
                      <ItemCard onPress={() => openEdit(a)}>
                        <View
                          className='w-11 h-11 rounded-2xl items-center justify-center'
                          style={{ backgroundColor: '#F4A0A080' }}
                        >
                          <CircleMinus
                            size={20}
                            color={Colors.brown}
                            strokeWidth={2.5}
                          />
                        </View>
                        <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                          {a.name}
                        </Text>
                        <Text className='font-ibm-bold text-base text-peach-dark'>
                          -{formatAmount(a.amount)}원
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
                <Text className='font-ibm-bold text-xs text-neutral-500 mb-2'>
                  보험
                </Text>
                <View className='gap-2'>
                  {insuranceAssets.map(a => (
                    <SwipeableDeleteRow
                      key={a.id}
                      onDelete={() => handleDelete(a.id)}
                    >
                      <ItemCard onPress={() => openEdit(a)}>
                        <View
                          className='w-11 h-11 rounded-2xl items-center justify-center'
                          style={{ backgroundColor: '#B5D5F080' }}
                        >
                          <ShieldCheck
                            size={20}
                            color={Colors.brown}
                            strokeWidth={2.5}
                          />
                        </View>
                        <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                          {a.name}
                        </Text>
                        <Text className='font-ibm-bold text-base text-neutral-800'>
                          {formatAmount(a.amount)}원
                        </Text>
                      </ItemCard>
                    </SwipeableDeleteRow>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 결제수단 섹션 */}
        <View className='mx-4 mt-8'>
          <View className='flex-row items-center justify-between mb-3'>
            <Text className='font-ibm-bold text-base text-neutral-700'>
              결제수단
            </Text>
            <TouchableOpacity
              onPress={openPaymentCreate}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text className='font-ibm-semibold text-xs text-brown bg-butter/50 rounded-2xl px-3 py-1.5'>
                + 추가
              </Text>
            </TouchableOpacity>
          </View>

          {pmLoading ? (
            <LoadingState />
          ) : paymentMethods.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title='등록된 결제수단이 없어요'
              description='카드, 교통카드 등을 등록해보세요'
            />
          ) : (
            <View className='gap-2'>
              {paymentMethods.map(pm => {
                const pmType = getPaymentMethodType(pm.type);
                return (
                  <SwipeableDeleteRow
                    key={pm.id}
                    onDelete={() => handlePaymentDelete(pm.id)}
                  >
                    <ItemCard onPress={() => openPaymentEdit(pm)}>
                      <View
                        className='w-11 h-11 rounded-2xl items-center justify-center'
                        style={{ backgroundColor: pmType.color + '80' }}
                      >
                        <pmType.Icon
                          size={20}
                          color={Colors.brown}
                          strokeWidth={2.5}
                        />
                      </View>
                      <View className='flex-1'>
                        <Text className='font-ibm-semibold text-sm text-neutral-800'>
                          {pm.name}
                        </Text>
                        <Text className='font-ibm-regular text-xs text-neutral-500 mt-0.5'>
                          {pmType.label}
                        </Text>
                      </View>
                    </ItemCard>
                  </SwipeableDeleteRow>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 자산 추가/수정 모달 ── */}
      <BottomSheet
        visible={modal.visible}
        onClose={() => setModal(s => ({ ...s, visible: false }))}
      >
        <BottomSheetHeader
          title={modal.editingId ? '자산 수정' : '자산 추가'}
          onClose={() => setModal(s => ({ ...s, visible: false }))}
          onDelete={
            modal.editingId ? () => handleDelete(modal.editingId!) : undefined
          }
          className='mb-5'
        />

        {/* 자산 유형 chips */}
        <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
          유형
        </Text>
        <View className='flex-row flex-wrap gap-2 mb-4'>
          {ASSET_TYPES.map(({ key, label }) => {
            const isSelected = modal.form.type === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() =>
                  setModal(s => ({ ...s, form: { ...s.form, type: key } }))
                }
                className={`px-3 py-2 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown-dark' : 'text-brown-dark/60'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ModalTextInput
          value={modal.form.name}
          onChangeText={v =>
            setModal(s => ({ ...s, form: { ...s.form, name: v } }))
          }
          placeholder='자산 이름 (예: 국민은행, 비상금)'
          maxLength={20}
          className='mb-4'
        />

        <AmountInput
          value={modal.form.amount}
          onChangeText={v =>
            setModal(s => ({ ...s, form: { ...s.form, amount: v } }))
          }
          placeholder='현재 잔액'
          className='mb-5'
        />

        <SaveButton
          onPress={handleSave}
          isSaving={isSaving}
          label={modal.editingId ? '수정 완료' : '저장'}
        />
      </BottomSheet>

      {/* ── 결제수단 추가/수정 모달 ── */}
      <BottomSheet
        visible={paymentModal.visible}
        onClose={() => setPaymentModal(s => ({ ...s, visible: false }))}
      >
        <BottomSheetHeader
          title={paymentModal.editingId ? '결제수단 수정' : '결제수단 추가'}
          onClose={() => setPaymentModal(s => ({ ...s, visible: false }))}
          onDelete={
            paymentModal.editingId
              ? () => handlePaymentDelete(paymentModal.editingId!)
              : undefined
          }
          className='mb-5'
        />

        {/* 결제수단 유형 chips */}
        <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
          유형
        </Text>
        <View className='flex-row flex-wrap gap-2 mb-4'>
          {PAYMENT_METHOD_TYPES.map(({ key, label }) => {
            const isSelected = paymentModal.form.type === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() =>
                  setPaymentModal(s => ({
                    ...s,
                    form: { ...s.form, type: key },
                  }))
                }
                className={`px-3 py-2 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown-dark' : 'text-brown-dark/60'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ModalTextInput
          value={paymentModal.form.name}
          onChangeText={v =>
            setPaymentModal(s => ({ ...s, form: { ...s.form, name: v } }))
          }
          placeholder='결제수단 이름 (예: 신한카드, T-money)'
          maxLength={20}
          className='mb-5'
        />

        <SaveButton
          onPress={handlePaymentSave}
          isSaving={isPaymentSaving}
          label={paymentModal.editingId ? '수정 완료' : '저장'}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}
