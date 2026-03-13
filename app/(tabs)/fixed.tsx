import { View, ScrollView, SafeAreaView, Alert, Modal } from 'react-native';
import { useState, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { Repeat } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  useFixedExpenses,
  useCreateFixedExpense,
  useUpdateFixedExpense,
  useDeleteFixedExpense,
} from '@/hooks/use-fixed-expenses';
import {
  useExpenseCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SummaryCard } from '@/components/ui/summary-card';
import { LoadingState } from '@/components/ui/loading-state';
import { FixedExpenseItem } from '@/components/fixed/fixed-expense-item';
import {
  FixedExpenseForm,
  type FormData,
  INITIAL_FORM,
} from '@/components/fixed/fixed-expense-form';
import {
  CategoryFormScreen,
  INITIAL_CATEGORY_FORM,
  type CategoryFormData,
} from '@/components/budget/category-form-screen';
import { resolveColor } from '@/constants/color-map';
import { CategoryManagementScreen } from '@/components/budget/category-management-screen';
import type { FixedExpense, Category } from '@/types/database';

type FixedView = 'main' | 'catMgmt' | 'catForm';

type State = {
  visible: boolean;
  view: FixedView;
  editingId: string | null;
  form: FormData;
  catEditingId: string | null;
  catForm: CategoryFormData;
  catFormSource: 'main' | 'catMgmt';
};

const INITIAL_STATE: State = {
  visible: false,
  view: 'main',
  editingId: null,
  form: INITIAL_FORM,
  catEditingId: null,
  catForm: INITIAL_CATEGORY_FORM,
  catFormSource: 'main',
};

export default function FixedScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const [state, setState] = useState<State>(INITIAL_STATE);

  const { data: fixedExpenses = [], isLoading } = useFixedExpenses();
  const { data: categories = [] } = useExpenseCategories();
  const create = useCreateFixedExpense();
  const update = useUpdateFixedExpense();
  const remove = useDeleteFixedExpense();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const isSaving = create.isPending || update.isPending;
  const isCatSaving = createCategory.isPending || updateCategory.isPending;
  const totalAmount = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);

  function openCreate() {
    setState({ ...INITIAL_STATE, visible: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openEdit(item: FixedExpense) {
    setState({
      ...INITIAL_STATE,
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

  function closeAll() {
    setState(INITIAL_STATE);
  }

  async function handleSave() {
    const name = state.form.name.trim();
    const amount = parseInt(state.form.amount.replace(/[^0-9]/g, ''), 10);

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
      due_day: state.form.due_day,
      category_id: state.form.category_id,
    };
    try {
      if (state.editingId) {
        await update.mutateAsync({ id: state.editingId, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeAll();
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function openCatCreate() {
    setState(s => ({
      ...s,
      view: 'catForm',
      catEditingId: null,
      catForm: INITIAL_CATEGORY_FORM,
      catFormSource: s.view === 'catMgmt' ? 'catMgmt' : 'main',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openCatEdit(c: Category) {
    setState(s => ({
      ...s,
      view: 'catForm',
      catEditingId: c.id,
      catForm: { name: c.name, icon: c.icon, color: c.color },
      catFormSource: 'catMgmt',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function backFromCatForm() {
    setState(s => ({ ...s, view: s.catFormSource }));
  }

  async function handleCatSave() {
    const name = state.catForm.name.trim();
    if (!name) {
      Alert.alert('입력 오류', '카테고리 이름을 입력해주세요');
      return;
    }
    try {
      if (state.catEditingId) {
        await updateCategory.mutateAsync({
          id: state.catEditingId,
          name,
          icon: state.catForm.icon,
          color: resolveColor(state.catForm.color),
        });
        setState(s => ({ ...s, view: 'catMgmt', catEditingId: null }));
      } else {
        await createCategory.mutateAsync({
          name,
          icon: state.catForm.icon,
          color: resolveColor(state.catForm.color),
          budget_amount: 0,
          sort_order: categories.length,
          type: 'expense',
        });
        setState(s => ({ ...s, view: s.catFormSource }));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleCatDelete(id: string) {
    Alert.alert('카테고리 삭제', '삭제하면 관련 예산도 사라져요. 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setState(s => ({ ...s, view: 'catMgmt', catEditingId: null }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
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
            closeAll();
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
                return (
                  <FixedExpenseItem
                    key={item.id}
                    item={item}
                    category={cat}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 고정지출 추가/수정 (풀스크린) ── */}
      <Modal
        visible={state.visible && state.view === 'main'}
        animationType='slide'
        onRequestClose={closeAll}
      >
        <FixedExpenseForm
          editingId={state.editingId}
          form={state.form}
          isSaving={isSaving}
          categories={categories}
          onChange={form => setState(s => ({ ...s, form }))}
          onClose={closeAll}
          onSave={handleSave}
          onDelete={
            state.editingId
              ? () => handleDelete(state.editingId!, state.form.name)
              : undefined
          }
          onCatCreate={openCatCreate}
          onCatMgmt={() => setState(s => ({ ...s, view: 'catMgmt' }))}
        />
      </Modal>

      {/* 카테고리 관리 모달 */}
      <Modal
        visible={state.visible && state.view === 'catMgmt'}
        animationType='none'
        onRequestClose={() => setState(s => ({ ...s, view: 'main' }))}
      >
        <CategoryManagementScreen
          categories={categories}
          filterType='expense'
          onBack={() => setState(s => ({ ...s, view: 'main' }))}
          onCreate={openCatCreate}
          onEdit={openCatEdit}
          onDelete={handleCatDelete}
        />
      </Modal>

      {/* 카테고리 추가/수정 모달 */}
      <Modal
        visible={state.visible && state.view === 'catForm'}
        animationType='none'
        onRequestClose={backFromCatForm}
      >
        <CategoryFormScreen
          editingId={state.catEditingId}
          form={state.catForm}
          isSaving={isCatSaving}
          categoryType='expense'
          onBack={backFromCatForm}
          onChange={catForm => setState(s => ({ ...s, catForm }))}
          onSave={handleCatSave}
          onDelete={
            state.catEditingId
              ? () => handleCatDelete(state.catEditingId!)
              : undefined
          }
          onTypeChange={() => {}}
        />
      </Modal>
    </SafeAreaView>
  );
}
