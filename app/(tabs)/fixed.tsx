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
import { CategoryManagementScreen } from '@/components/budget/category-management-screen';
import type { FixedExpense, Category } from '@/types/database';

type CatView = 'catForm' | 'catMgmt';

export default function FixedScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const [modal, setModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: FormData;
  }>({ visible: false, editingId: null, form: INITIAL_FORM });

  const [catModal, setCatModal] = useState<{
    view: CatView | null;
    editingId: string | null;
    form: CategoryFormData;
  }>({ view: null, editingId: null, form: INITIAL_CATEGORY_FORM });

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

  function openCatCreate() {
    setCatModal({
      view: 'catForm',
      editingId: null,
      form: INITIAL_CATEGORY_FORM,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openCatEdit(c: Category) {
    setCatModal({
      view: 'catForm',
      editingId: c.id,
      form: { name: c.name, icon: c.icon, color: c.color },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleCatSave() {
    const name = catModal.form.name.trim();
    if (!name) {
      Alert.alert('입력 오류', '카테고리 이름을 입력해주세요');
      return;
    }
    try {
      if (catModal.editingId) {
        await updateCategory.mutateAsync({
          id: catModal.editingId,
          name,
          icon: catModal.form.icon,
          color: catModal.form.color,
        });
        setCatModal(s => ({ ...s, view: 'catMgmt', editingId: null }));
      } else {
        await createCategory.mutateAsync({
          name,
          icon: catModal.form.icon,
          color: catModal.form.color,
          budget_amount: 0,
          sort_order: categories.length,
          type: 'expense',
        });
        setCatModal(s => ({ ...s, view: null }));
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
            setCatModal(s => ({ ...s, view: 'catMgmt', editingId: null }));
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

      {/* ── 추가 / 수정 모달 ── */}
      <FixedExpenseForm
        visible={modal.visible}
        editingId={modal.editingId}
        form={modal.form}
        isSaving={isSaving}
        categories={categories}
        onChange={form => setModal(s => ({ ...s, form }))}
        onClose={closeModal}
        onSave={handleSave}
        onCatCreate={openCatCreate}
        onCatMgmt={() => setCatModal(s => ({ ...s, view: 'catMgmt' }))}
      />

      {/* 카테고리 관리 모달 */}
      <Modal
        visible={catModal.view === 'catMgmt'}
        animationType='none'
        onRequestClose={() => setCatModal(s => ({ ...s, view: null }))}
      >
        <CategoryManagementScreen
          categories={categories}
          filterType='expense'
          onBack={() => setCatModal(s => ({ ...s, view: null }))}
          onCreate={openCatCreate}
          onEdit={openCatEdit}
          onDelete={handleCatDelete}
        />
      </Modal>

      {/* 카테고리 추가/수정 모달 */}
      <Modal
        visible={catModal.view === 'catForm'}
        animationType='none'
        onRequestClose={() =>
          setCatModal(s => ({
            ...s,
            view: s.editingId ? 'catMgmt' : null,
          }))
        }
      >
        <CategoryFormScreen
          editingId={catModal.editingId}
          form={catModal.form}
          isSaving={isCatSaving}
          categoryType='expense'
          onBack={() =>
            setCatModal(s => ({
              ...s,
              view: s.editingId ? 'catMgmt' : null,
            }))
          }
          onChange={form => setCatModal(s => ({ ...s, form }))}
          onSave={handleCatSave}
          onDelete={
            catModal.editingId
              ? () => handleCatDelete(catModal.editingId!)
              : undefined
          }
          onTypeChange={() => {}}
        />
      </Modal>
    </SafeAreaView>
  );
}
