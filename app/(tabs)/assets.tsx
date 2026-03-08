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
  Trash2,
  Landmark,
  Banknote,
  TrendingUp,
  PiggyBank,
  Building2,
  Wallet,
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
import type { Asset } from '../../types/database';

type AssetType = {
  key: string;
  label: string;
  Icon: LucideIcon;
  color: string;
};

const ASSET_TYPES: AssetType[] = [
  { key: 'bank', label: '은행 계좌', Icon: Landmark, color: '#B5D5F0' },
  { key: 'cash', label: '현금', Icon: Banknote, color: '#A8D8B0' },
  { key: 'investment', label: '주식/펀드', Icon: TrendingUp, color: '#D4C5F0' },
  { key: 'saving', label: '적금/예금', Icon: PiggyBank, color: '#FAD97A' },
  { key: 'real_estate', label: '부동산', Icon: Building2, color: '#F5D0A0' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#F0C5D5' },
];

function getAssetType(key: string): AssetType {
  return (
    ASSET_TYPES.find(t => t.key === key) ?? ASSET_TYPES[ASSET_TYPES.length - 1]
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

const INITIAL_FORM: FormData = { name: '', amount: '', type: 'bank' };

export default function AssetsTab() {
  const { data: assets = [], isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [modal, setModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: FormData;
  }>({
    visible: false,
    editingId: null,
    form: INITIAL_FORM,
  });

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const isSaving = createAsset.isPending || updateAsset.isPending;

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

  // 유형별 그룹핑
  const grouped = ASSET_TYPES.map(t => ({
    ...t,
    items: assets.filter(a => a.type === t.key),
  })).filter(g => g.items.length > 0);

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ScreenHeader title='자산' onAdd={openCreate} />

        <SummaryCard
          label='총 자산'
          amount={totalAssets}
          subtext={`항목 ${assets.length}개`}
        />

        {/* 유형별 분류 */}
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
            {grouped.map(group => {
              const groupTotal = group.items.reduce((s, a) => s + a.amount, 0);
              return (
                <View key={group.key}>
                  <View className='flex-row items-center justify-between mb-2'>
                    <View className='flex-row items-center gap-2'>
                      <group.Icon
                        size={14}
                        color={Colors.brown + '80'}
                        strokeWidth={2}
                      />
                      <Text className='font-ibm-semibold text-xs text-neutral-500'>
                        {group.label}
                      </Text>
                    </View>
                    <Text className='font-ibm-semibold text-xs text-neutral-500'>
                      {formatAmount(groupTotal)}원
                    </Text>
                  </View>
                  <View className='gap-2'>
                    {group.items.map(a => (
                      <ItemCard key={a.id} onPress={() => openEdit(a)}>
                        <View
                          className='w-11 h-11 rounded-2xl items-center justify-center'
                          style={{ backgroundColor: group.color + '80' }}
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
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
          {ASSET_TYPES.map(({ key, label, Icon, color }) => {
            const isSelected = modal.form.type === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() =>
                  setModal(s => ({ ...s, form: { ...s.form, type: key } }))
                }
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl ${isSelected ? '' : 'bg-neutral-100'}`}
                style={isSelected ? { backgroundColor: color } : {}}
                activeOpacity={0.7}
              >
                <Icon size={14} color={Colors.brown} strokeWidth={2.5} />
                <Text
                  className={`font-ibm-semibold text-xs ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
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
    </SafeAreaView>
  );
}
