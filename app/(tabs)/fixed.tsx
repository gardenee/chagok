import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Repeat, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import {
  useFixedExpenses,
  useCreateFixedExpense,
  useUpdateFixedExpense,
  useDeleteFixedExpense,
} from '../../hooks/use-fixed-expenses';
import { useExpenseCategories } from '../../hooks/use-categories';
import { EmptyState } from '../../components/ui/empty-state';
import {
  BottomSheet,
  BottomSheetHeader,
} from '../../components/ui/bottom-sheet';
import { SaveButton } from '../../components/ui/save-button';
import { ModalTextInput, AmountInput } from '../../components/ui/modal-inputs';
import { ScreenHeader } from '../../components/ui/screen-header';
import { SummaryCard } from '../../components/ui/summary-card';
import { LoadingState } from '../../components/ui/loading-state';
import { SwipeableDeleteRow } from '../../components/ui/swipeable-delete-row';
import { ICON_MAP } from '../../components/ui/category-form-screen';
import { IconBox } from '../../components/ui/icon-box';
import { ColorPill } from '../../components/ui/color-pill';
import { formatAmount } from '../../utils/format';
import type { FixedExpense } from '../../types/database';

type FormData = {
  name: string;
  amount: string;
  due_day: number;
  category_id: string | null;
};

const INITIAL_FORM: FormData = {
  name: '',
  amount: '',
  due_day: 1,
  category_id: null,
};

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
  const { data: categories = [] } = useExpenseCategories();
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
        category_id: item.category_id ?? null,
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

    const payload = {
      name,
      amount,
      due_day: modal.form.due_day,
      category_id: modal.form.category_id,
    };
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
              {fixedExpenses.map(item => {
                const cat = categories.find(c => c.id === item.category_id);
                const CatIcon = cat ? (ICON_MAP[cat.icon] ?? Wallet) : null;
                return (
                  <SwipeableDeleteRow
                    key={item.id}
                    onDelete={() => handleDelete(item.id, item.name)}
                  >
                    <TouchableOpacity
                      onPress={() => openEdit(item)}
                      activeOpacity={0.8}
                    >
                      <View
                        className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
                        style={{
                          shadowColor: Colors.brown,
                          shadowOpacity: 0.07,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 2 },
                        }}
                      >
                        {/* 아이콘 */}
                        <IconBox color={Colors.peach} size='md'>
                          <Repeat
                            size={19}
                            color={Colors.peach}
                            strokeWidth={2.5}
                          />
                        </IconBox>

                        {/* 이름 + 날짜 + 카테고리 */}
                        <View className='flex-1'>
                          <Text className='font-ibm-semibold text-sm text-neutral-800'>
                            {item.name}
                          </Text>
                          <View className='flex-row items-center gap-1.5 mt-0.5'>
                            <Text className='font-ibm-regular text-xs text-neutral-500'>
                              {ordinalDay(item.due_day)}
                            </Text>
                            {cat && CatIcon && (
                              <ColorPill
                                label={cat.name}
                                color={cat.color}
                                icon={CatIcon}
                              />
                            )}
                          </View>
                        </View>

                        {/* 금액 */}
                        <Text className='font-ibm-bold text-sm text-neutral-800'>
                          {formatAmount(item.amount)}원
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </SwipeableDeleteRow>
                );
              })}
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

        {/* 카테고리 선택 */}
        {categories.length > 0 && (
          <View className='mb-4'>
            <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
              카테고리 (선택)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            >
              <View className='flex-row gap-2 pr-2'>
                <TouchableOpacity
                  onPress={() =>
                    setModal(s => ({
                      ...s,
                      form: { ...s.form, category_id: null },
                    }))
                  }
                  className={`items-center gap-1`}
                  activeOpacity={0.7}
                >
                  <View
                    className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100'
                    style={{
                      borderWidth: modal.form.category_id === null ? 2 : 0,
                      borderColor: Colors.brown,
                    }}
                  >
                    <Wallet size={20} color='#A3A3A3' strokeWidth={2.5} />
                  </View>
                  <Text className='font-ibm-semibold text-[10px] text-neutral-500'>
                    없음
                  </Text>
                </TouchableOpacity>
                {categories.map(c => {
                  const Icon = ICON_MAP[c.icon] ?? Wallet;
                  const isSelected = modal.form.category_id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setModal(s => ({
                          ...s,
                          form: {
                            ...s.form,
                            category_id: isSelected ? null : c.id,
                          },
                        }));
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className='items-center gap-1'
                      activeOpacity={0.7}
                    >
                      <View
                        className='w-12 h-12 rounded-2xl items-center justify-center'
                        style={{
                          backgroundColor: c.color + '30',
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: isSelected ? c.color : 'transparent',
                        }}
                      >
                        <Icon size={20} color={c.color} strokeWidth={2.5} />
                      </View>
                      <Text
                        className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 납부일 */}
        <View className='mb-6'>
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            납부일
          </Text>
          <View className='flex-row flex-wrap gap-1.5'>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
              const isSelected = modal.form.due_day === day;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() =>
                    setModal(s => ({ ...s, form: { ...s.form, due_day: day } }))
                  }
                  className={`rounded-xl items-center justify-center ${isSelected ? 'bg-butter' : 'bg-neutral-100'}`}
                  style={{ width: 38, height: 36 }}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown' : 'text-neutral-500'}`}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
