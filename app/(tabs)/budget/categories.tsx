import { Alert, Modal } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import {
  CategoryFormScreen,
  CategoryFormData,
  INITIAL_CATEGORY_FORM,
} from '@/components/budget/category-form-screen';
import { resolveColor, resolveColorKey } from '@/constants/color-map';
import { CategoryManagementScreen } from '@/components/budget/category-management-screen';
import type { Category } from '@/types/database';

type ModalState = {
  visible: boolean;
  editingId: string | null;
  categoryType: 'expense' | 'income';
  form: CategoryFormData;
};

const INITIAL_MODAL: ModalState = {
  visible: false,
  editingId: null,
  categoryType: 'expense',
  form: INITIAL_CATEGORY_FORM,
};

export default function CategoriesScreen() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const isSaving = createCategory.isPending || updateCategory.isPending;

  function openCreate(type: 'expense' | 'income') {
    setModal({
      visible: false,
      editingId: null,
      categoryType: type,
      form: INITIAL_CATEGORY_FORM,
    });
    requestAnimationFrame(() => setModal(s => ({ ...s, visible: true })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openEdit(c: Category) {
    setModal({
      visible: false,
      editingId: c.id,
      categoryType: c.type,
      form: { name: c.name, icon: c.icon, color: resolveColorKey(c.color) },
    });
    requestAnimationFrame(() => setModal(s => ({ ...s, visible: true })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSave() {
    const name = modal.form.name.trim();
    if (!name) {
      Alert.alert('입력 오류', '카테고리 이름을 입력해주세요');
      return;
    }
    try {
      if (modal.editingId) {
        await updateCategory.mutateAsync({
          id: modal.editingId,
          name,
          icon: modal.form.icon,
          color: resolveColor(modal.form.color),
        });
      } else {
        const list =
          modal.categoryType === 'expense'
            ? expenseCategories
            : incomeCategories;
        await createCategory.mutateAsync({
          name,
          icon: modal.form.icon,
          color: resolveColor(modal.form.color),
          budget_amount: 0,
          sort_order: list.length,
          type: modal.categoryType,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(INITIAL_MODAL);
    } catch (err) {
      console.error('[handleSave]', err);
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
            setModal(INITIAL_MODAL);
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  return (
    <>
      <CategoryManagementScreen
        categories={categories}
        onBack={() => router.back()}
        onCreate={() => openCreate('expense')}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        visible={modal.visible}
        animationType='slide'
        onRequestClose={() => setModal(INITIAL_MODAL)}
      >
        <CategoryFormScreen
          editingId={modal.editingId}
          form={modal.form}
          isSaving={isSaving}
          categoryType={modal.categoryType}
          onBack={() => setModal(INITIAL_MODAL)}
          onChange={form => setModal(s => ({ ...s, form }))}
          onSave={handleSave}
          onDelete={
            modal.editingId ? () => handleDelete(modal.editingId!) : undefined
          }
          onTypeChange={type =>
            setModal(s => ({
              ...s,
              categoryType: type,
              form: { ...INITIAL_CATEGORY_FORM },
            }))
          }
        />
      </Modal>
    </>
  );
}
