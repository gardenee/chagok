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
  Repeat,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import {
  useFixedExpenses,
  useCreateFixedExpense,
  useUpdateFixedExpense,
  useDeleteFixedExpense,
} from '../../hooks/use-fixed-expenses';
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
import type { FixedExpense } from '../../types/database';

type FormData = {
  name: string;
  amount: string;
  due_day: number;
};

const INITIAL_FORM: FormData = { name: '', amount: '', due_day: 1 };

function ordinalDay(day: number): string {
  return `매월 ${day}일`;
}

export default function FixedScreen() {
  const [modal, setModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: FormData;
  }>({ visible: false, editingId: null, form: INITIAL_FORM });

  const { data: fixedExpenses = [], isLoading } = useFixedExpenses();
  const create = useCreateFixedExpense();
  const update = useUpdateFixedExpense();
  const remove = useDeleteFixedExpense();

  const isSaving = create.isPending || update.isPending;
  const totalAmount = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);

  function openCreate() {
    setModal({ visible: true, editingId: null, form: INITIAL_FORM });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openEdit(item: FixedExpense) {
    setModal({
      visible: true,
      editingId: item.id,
      form: {
        name: item.name,
        amount: String(item.amount),
        due_day: item.due_day,
      },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function closeModal() {
    setModal(s => ({ ...s, visible: false }));
  }

  async function handleSave() {
    const name = modal.form.name.trim();
    const amount = parseInt(modal.form.amount.replace(/[^0-9]/g, ''), 10);

    if (!name) {
      Alert.alert('입력 오류', '항목 이름을 입력해주세요');
      return;
    }
    if (!amount || amount <= 0) {
      Alert.alert('입력 오류', '금액을 올바르게 입력해주세요');
      return;
    }

    const payload = { name, amount, due_day: modal.form.due_day };
    try {
      if (modal.editingId) {
        await update.mutateAsync({ id: modal.editingId, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('고정지출 삭제', `"${name}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  function adjustDueDay(delta: number) {
    setModal(s => {
      const next = s.form.due_day + delta;
      if (next < 1 || next > 31) return s;
      return { ...s, form: { ...s.form, due_day: next } };
    });
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <ScreenHeader title='고정지출' onAdd={openCreate} />

        <SummaryCard
          label='매월 고정지출'
          amount={totalAmount}
          subtext={`총 ${fixedExpenses.length}개 항목`}
        />

        {/* 목록 */}
        <View className='mx-4 mt-5'>
          {isLoading ? (
            <LoadingState />
          ) : fixedExpenses.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title='등록된 고정지출이 없어요'
              description='월세, 구독, 보험 등을 등록해보세요'
            />
          ) : (
            <View className='gap-2.5'>
              {fixedExpenses.map(item => (
                <ItemCard key={item.id} onPress={() => openEdit(item)}>
                  {/* 아이콘 */}
                  <View className='w-11 h-11 rounded-2xl items-center justify-center bg-peach/40'>
                    <Repeat size={19} color={Colors.peach} strokeWidth={2.5} />
                  </View>

                  {/* 이름 + 날짜 */}
                  <View className='flex-1'>
                    <Text className='font-ibm-semibold text-sm text-neutral-800'>
                      {item.name}
                    </Text>
                    <Text className='font-ibm-regular text-xs text-neutral-500 mt-0.5'>
                      {ordinalDay(item.due_day)}
                    </Text>
                  </View>

                  {/* 금액 + 삭제 */}
                  <View className='items-end gap-2'>
                    <Text className='font-ibm-bold text-sm text-neutral-800'>
                      {item.amount.toLocaleString('ko-KR')}원
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.name)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2
                        size={13}
                        color={Colors.brown + '50'}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  </View>
                </ItemCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 추가 / 수정 모달 ── */}
      <BottomSheet visible={modal.visible} onClose={closeModal}>
        <BottomSheetHeader
          title={modal.editingId ? '고정지출 수정' : '고정지출 추가'}
          onClose={closeModal}
          className='mb-6'
        />

        <ModalTextInput
          value={modal.form.name}
          onChangeText={v =>
            setModal(s => ({ ...s, form: { ...s.form, name: v } }))
          }
          placeholder='항목 이름 (예: 월세, 넷플릭스)'
          maxLength={20}
          autoFocus={!modal.editingId}
          className='mb-4'
        />

        <AmountInput
          value={modal.form.amount}
          onChangeText={v =>
            setModal(s => ({ ...s, form: { ...s.form, amount: v } }))
          }
          className='mb-4'
        />

        {/* 납부일 */}
        <View className='mb-6'>
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            납부일
          </Text>
          <View className='bg-neutral-100 rounded-2xl px-4 py-3 flex-row items-center justify-between'>
            <TouchableOpacity
              onPress={() => adjustDueDay(-1)}
              disabled={modal.form.due_day <= 1}
              className='w-9 h-9 rounded-xl bg-cream items-center justify-center'
              activeOpacity={0.7}
            >
              <ChevronLeft
                size={18}
                color={
                  modal.form.due_day <= 1 ? Colors.brown + '30' : Colors.brown
                }
                strokeWidth={2.5}
              />
            </TouchableOpacity>
            <Text className='font-ibm-bold text-base text-neutral-800'>
              매월 {modal.form.due_day}일
            </Text>
            <TouchableOpacity
              onPress={() => adjustDueDay(1)}
              disabled={modal.form.due_day >= 31}
              className='w-9 h-9 rounded-xl bg-cream items-center justify-center'
              activeOpacity={0.7}
            >
              <ChevronRight
                size={18}
                color={
                  modal.form.due_day >= 31 ? Colors.brown + '30' : Colors.brown
                }
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          </View>
        </View>

        <SaveButton
          onPress={handleSave}
          isSaving={isSaving}
          label={modal.editingId ? '수정 완료' : '저장'}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}
