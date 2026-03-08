import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ui/screen-header';
import { LoadingState } from '../../components/ui/loading-state';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/use-categories';
import { useMonthTransactions } from '../../hooks/use-transactions';
import type { Category } from '../../types/database';
import {
  CategoryFormScreen,
  ICON_MAP,
  CategoryFormData,
  INITIAL_CATEGORY_FORM,
} from '../../components/ui/category-form-screen';

function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR');
}

function CategoryIcon({
  iconKey,
  color,
  size = 18,
}: {
  iconKey: string;
  color: string;
  size?: number;
}) {
  const Icon = ICON_MAP[iconKey] ?? Wallet;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
}

export default function BudgetTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: categories = [], isLoading } = useCategories();
  const { data: transactions = [] } = useMonthTransactions(year, month);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modal, setModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: CategoryFormData;
  }>({
    visible: false,
    editingId: null,
    form: INITIAL_CATEGORY_FORM,
  });

  // 카테고리별 이번달 지출 합산
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.category_id) {
        map[t.category_id] = (map[t.category_id] ?? 0) + t.amount;
      }
    }
    return map;
  }, [transactions]);

  const totalBudget = categories.reduce((s, c) => s + c.budget_amount, 0);
  const totalSpent = categories.reduce(
    (s, c) => s + (spendingByCategory[c.id] ?? 0),
    0,
  );
  const totalRemaining = totalBudget - totalSpent;
  const totalRatio =
    totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
  const isOver = totalSpent > totalBudget && totalBudget > 0;

  const isSaving = createCategory.isPending || updateCategory.isPending;

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

  function openCreate() {
    setModal({ visible: true, editingId: null, form: INITIAL_CATEGORY_FORM });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openEdit(c: Category) {
    setModal({
      visible: true,
      editingId: c.id,
      form: {
        name: c.name,
        icon: c.icon,
        color: c.color,
        budget_amount: String(c.budget_amount),
      },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSave() {
    const name = modal.form.name.trim();
    const amount = parseInt(
      modal.form.budget_amount.replace(/[^0-9]/g, ''),
      10,
    );
    if (!name) {
      Alert.alert('입력 오류', '카테고리 이름을 입력해주세요');
      return;
    }
    if (!amount || amount <= 0) {
      Alert.alert('입력 오류', '예산을 올바르게 입력해주세요');
      return;
    }
    try {
      if (modal.editingId) {
        await updateCategory.mutateAsync({
          id: modal.editingId,
          name,
          icon: modal.form.icon,
          color: modal.form.color,
          budget_amount: amount,
        });
      } else {
        await createCategory.mutateAsync({
          name,
          icon: modal.form.icon,
          color: modal.form.color,
          budget_amount: amount,
          sort_order: categories.length,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleDelete(id: string) {
    Alert.alert('카테고리 삭제', '삭제하면 관련 예산도 사라져요. 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setModal(s => ({ ...s, visible: false }));
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
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 헤더 */}
        <ScreenHeader title='예산·결산' onAdd={openCreate} />

        {/* 월 네비게이터 */}
        <View className='flex-row items-center justify-center gap-5 px-6 pt-1 pb-3'>
          <TouchableOpacity
            onPress={prevMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={20} color='#404040' strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className='font-ibm-semibold text-base text-neutral-700 w-24 text-center'>
            {year}년 {month + 1}월
          </Text>
          <TouchableOpacity
            onPress={nextMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronRight size={20} color='#404040' strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* 총 예산 vs 지출 요약 카드 */}
        {totalBudget > 0 && (
          <View
            className='mx-4 rounded-3xl px-6 py-5'
            style={{
              backgroundColor: isOver ? Colors.peach : Colors.butter,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <View className='flex-row justify-between items-start mb-3'>
              <View>
                <Text className='font-ibm-regular text-xs text-brown/80 mb-0.5'>
                  이번 달 지출
                </Text>
                <Text className='font-ibm-bold text-2xl text-brown'>
                  {formatAmount(totalSpent)}원
                </Text>
              </View>
              <View className='items-end'>
                <Text className='font-ibm-regular text-xs text-brown/80 mb-0.5'>
                  총 예산
                </Text>
                <Text className='font-ibm-semibold text-base text-brown'>
                  {formatAmount(totalBudget)}원
                </Text>
              </View>
            </View>

            {/* 전체 프로그레스 바 */}
            <View className='bg-brown/15 rounded-full h-2 mb-2'>
              <View
                className='h-2 rounded-full bg-brown/60'
                style={{ width: `${totalRatio * 100}%` }}
              />
            </View>

            <Text className='font-ibm-semibold text-xs text-brown/80'>
              {isOver
                ? `예산 ${formatAmount(totalSpent - totalBudget)}원 초과`
                : `${formatAmount(totalRemaining)}원 남음`}
            </Text>
          </View>
        )}

        {/* 카테고리별 결산 */}
        <View className='mx-4 mt-5'>
          <Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
            카테고리별 현황
          </Text>

          {isLoading ? (
            <LoadingState />
          ) : categories.length === 0 ? (
            <View className='bg-cream-dark/40 rounded-3xl py-12 items-center gap-3'>
              <Wallet size={32} color={Colors.brown + '30'} strokeWidth={1.5} />
              <Text className='font-ibm-semibold text-sm text-neutral-400'>
                카테고리가 없어요
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                + 버튼으로 추가해보세요
              </Text>
            </View>
          ) : (
            <View className='gap-2.5'>
              {categories.map(c => {
                const spent = spendingByCategory[c.id] ?? 0;
                const ratio =
                  c.budget_amount > 0
                    ? Math.min(spent / c.budget_amount, 1)
                    : 0;
                const over = spent > c.budget_amount && c.budget_amount > 0;
                const remaining = c.budget_amount - spent;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => openEdit(c)}
                    activeOpacity={0.8}
                  >
                    <View
                      className='bg-white rounded-3xl px-4 py-4'
                      style={{
                        shadowColor: Colors.brown,
                        shadowOpacity: 0.07,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 2 },
                      }}
                    >
                      <View className='flex-row items-center gap-3 mb-3'>
                        <View
                          className='w-10 h-10 rounded-2xl items-center justify-center'
                          style={{ backgroundColor: c.color + '55' }}
                        >
                          <CategoryIcon iconKey={c.icon} color={c.color} />
                        </View>
                        <View className='flex-1'>
                          <Text className='font-ibm-semibold text-sm text-neutral-800'>
                            {c.name}
                          </Text>
                          <Text className='font-ibm-regular text-xs text-neutral-500'>
                            예산 {formatAmount(c.budget_amount)}원
                          </Text>
                        </View>
                        <View className='items-end'>
                          <Text
                            className={`font-ibm-bold text-sm ${over ? 'text-peach' : 'text-neutral-800'}`}
                          >
                            {formatAmount(spent)}원
                          </Text>
                          <Text className='font-ibm-regular text-[10px] text-neutral-400'>
                            {over
                              ? `${formatAmount(spent - c.budget_amount)}원 초과`
                              : `${formatAmount(remaining)}원 남음`}
                          </Text>
                        </View>
                      </View>

                      {/* 카테고리 프로그레스 바 */}
                      <View className='bg-cream-dark rounded-full h-1.5'>
                        <View
                          className='h-1.5 rounded-full'
                          style={{
                            width: `${ratio * 100}%`,
                            backgroundColor: over ? Colors.peach : c.color,
                          }}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 카테고리 추가/수정 모달 (풀스크린) ── */}
      <Modal
        visible={modal.visible}
        animationType='slide'
        onRequestClose={() => setModal(s => ({ ...s, visible: false }))}
      >
        <CategoryFormScreen
          editingId={modal.editingId}
          form={modal.form}
          isSaving={isSaving}
          onBack={() => setModal(s => ({ ...s, visible: false }))}
          onChange={form => setModal(s => ({ ...s, form }))}
          onSave={handleSave}
          onDelete={
            modal.editingId ? () => handleDelete(modal.editingId!) : undefined
          }
        />
      </Modal>
    </SafeAreaView>
  );
}
