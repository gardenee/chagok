import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Wallet,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../../hooks/use-categories';
import { IconBox } from '../../../components/ui/icon-box';
import { LoadingState } from '../../../components/ui/loading-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { SwipeableDeleteRow } from '../../../components/ui/swipeable-delete-row';
import {
  CategoryFormScreen,
  ICON_MAP,
  CategoryFormData,
  INITIAL_CATEGORY_FORM,
} from '../../../components/ui/category-form-screen';
import { formatAmount } from '../../../utils/format';
import type { Category } from '../../../types/database';
import type { LucideIcon } from 'lucide-react-native';

function CategoryIcon({
  iconKey,
  color,
  size = 18,
}: {
  iconKey: string;
  color: string;
  size?: number;
}) {
  const Icon: LucideIcon = ICON_MAP[iconKey] ?? Wallet;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
}

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
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const isSaving = createCategory.isPending || updateCategory.isPending;

  function openCreate(type: 'expense' | 'income') {
    setModal({
      visible: true,
      editingId: null,
      categoryType: type,
      form: INITIAL_CATEGORY_FORM,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openEdit(c: Category) {
    setModal({
      visible: true,
      editingId: c.id,
      categoryType: c.type,
      form: {
        name: c.name,
        icon: c.icon,
        color: c.color,
        budget_amount:
          c.type === 'income' && c.budget_amount === 0
            ? ''
            : String(c.budget_amount),
      },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSave() {
    const name = modal.form.name.trim();
    const isIncome = modal.categoryType === 'income';
    const amount =
      parseInt(modal.form.budget_amount.replace(/[^0-9]/g, ''), 10) || 0;

    if (!name) {
      Alert.alert('입력 오류', '카테고리 이름을 입력해주세요');
      return;
    }
    if (!isIncome && (!amount || amount <= 0)) {
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
        const list =
          modal.categoryType === 'expense'
            ? expenseCategories
            : incomeCategories;
        await createCategory.mutateAsync({
          name,
          icon: modal.form.icon,
          color: modal.form.color,
          budget_amount: amount,
          sort_order: list.length,
          type: modal.categoryType,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(INITIAL_MODAL);
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
            setModal(INITIAL_MODAL);
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  function CategoryRow({ c }: { c: Category }) {
    return (
      <SwipeableDeleteRow onDelete={() => handleDelete(c.id)}>
        <TouchableOpacity onPress={() => openEdit(c)} activeOpacity={0.8}>
          <View
            className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
            style={Shadows.primary}
          >
            <IconBox color={c.color}>
              <CategoryIcon iconKey={c.icon} color={c.color} />
            </IconBox>
            <View className='flex-1'>
              <Text className='font-ibm-semibold text-sm text-neutral-800'>
                {c.name}
              </Text>
              {c.type === 'expense' && c.budget_amount > 0 && (
                <Text className='font-ibm-regular text-xs text-neutral-400'>
                  예산 {formatAmount(c.budget_amount)}원
                </Text>
              )}
            </View>
            <ChevronRight size={16} color='#A3A3A3' strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </SwipeableDeleteRow>
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
          <Text className='font-ibm-bold text-xl text-brown-darker flex-1'>
            카테고리 관리
          </Text>
          <TouchableOpacity
            onPress={() => openCreate('expense')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* 지출 섹션 */}
            <View className='mx-4 mt-4 mb-6'>
              <Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
                지출
              </Text>

              {expenseCategories.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title='지출 카테고리가 없어요'
                  description='우상단 + 버튼으로 만들어보세요'
                />
              ) : (
                <View className='gap-2.5'>
                  {expenseCategories.map(c => (
                    <CategoryRow key={c.id} c={c} />
                  ))}
                </View>
              )}
            </View>

            {/* 수입 섹션 */}
            <View className='mx-4'>
              <Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
                수입
              </Text>

              {incomeCategories.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title='수입 카테고리가 없어요'
                  description='우상단 + 버튼으로 만들어보세요'
                />
              ) : (
                <View className='gap-2.5'>
                  {incomeCategories.map(c => (
                    <CategoryRow key={c.id} c={c} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* 카테고리 추가/수정 모달 */}
      <Modal
        visible={modal.visible}
        animationType='slide'
        onRequestClose={() => setModal(INITIAL_MODAL)}
      >
        <CategoryFormScreen
          editingId={modal.editingId}
          form={modal.form}
          isSaving={isSaving}
          mode='budget'
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
    </SafeAreaView>
  );
}
