import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCalendarStore } from '@/store/calendar';
import { useAuthStore } from '@/store/auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import {
  useMonthTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/use-payment-methods';
import { useAssets } from '@/hooks/use-assets';
import { getPmColor, INITIAL_PM_FORM } from '@/constants/payment-method';
import { resolveColor, resolveColorKey } from '@/constants/color-map';
import { INITIAL_CATEGORY_FORM } from '@/components/budget/category-form-screen';
import { TransactionFormSheet } from '@/components/calendar/transaction-form-sheet';
import {
  INITIAL_TX_FORM,
  type TxModalState,
  type TxFormData,
} from '@/components/calendar/types';
import type { Asset, Category } from '@/types/database';

export default function TransactionFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    date: string;
    editingId?: string;
    fixedExpenseId?: string;
    amount?: string;
    type?: string;
    tag?: string;
    memo?: string;
    category_id?: string;
    payment_method_id?: string;
    asset_id?: string;
  }>();

  const { session, userProfile } = useAuthStore();
  const myId = session?.user.id ?? '';
  const { data: members = [] } = useCoupleMembers();
  const partner = members.find(m => m.id !== myId);
  const myNickname = userProfile?.nickname ?? '나';
  const partnerNickname = partner?.nickname ?? '파트너';
  const tagOptions = [
    { value: 'me' as const, label: myNickname },
    { value: 'partner' as const, label: partnerNickname },
    { value: 'together' as const, label: '함께' },
  ];

  const dateParam = params.date ?? '';
  const [year, month] = dateParam
    ? [parseInt(dateParam.split('-')[0]), parseInt(dateParam.split('-')[1])]
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  const { data: transactions = [] } = useMonthTransactions(year, month);
  const { data: categories = [] } = useCategories();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: allAssets = [] } = useAssets();
  const bankCashAssets = allAssets.filter(
    (a: Asset) => a.type === 'bank' || a.type === 'cash',
  );

  const initialForm: TxFormData = {
    amount: params.amount ?? '',
    type: (params.type as TxFormData['type']) ?? 'expense',
    tag: (params.tag as TxFormData['tag']) || null,
    memo: params.memo ?? '',
    date: dateParam,
    category_id: params.category_id || null,
    payment_method_id: params.payment_method_id || null,
    asset_id: params.asset_id || null,
  };

  const [txModal, setTxModal] = useState<TxModalState>({
    visible: true,
    editingId: params.editingId ?? null,
    form: initialForm,
    view: 'tx',
    catEditingId: null,
    catCategoryType: (params.type as 'expense' | 'income') ?? 'expense',
    catForm: INITIAL_CATEGORY_FORM,
    catFormSource: 'tx',
    pmEditingId: null,
    pmForm: INITIAL_PM_FORM,
    fixedExpenseId: params.fixedExpenseId ?? null,
  });

  const setPendingReturnDate = useCalendarStore(s => s.setPendingReturnDate);

  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  const isTxSaving = createTx.isPending || updateTx.isPending;
  const isCatSaving = createCategory.isPending || updateCategory.isPending;
  const isPmSaving =
    createPaymentMethod.isPending || updatePaymentMethod.isPending;

  async function handleTxSave() {
    const amount = parseInt(txModal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (params.editingId) {
      const noChange =
        txModal.form.amount === initialForm.amount &&
        txModal.form.type === initialForm.type &&
        txModal.form.tag === initialForm.tag &&
        txModal.form.memo === initialForm.memo &&
        txModal.form.date === initialForm.date &&
        txModal.form.category_id === initialForm.category_id &&
        txModal.form.payment_method_id === initialForm.payment_method_id &&
        txModal.form.asset_id === initialForm.asset_id;
      if (noChange) {
        router.back();
        return;
      }
    }
    const payload = {
      amount,
      type: txModal.form.type,
      ...(txModal.form.tag ? { tag: txModal.form.tag } : {}),
      memo: txModal.form.memo.trim() || null,
      date: txModal.form.date || dateParam,
      category_id: txModal.form.category_id,
      payment_method_id: txModal.form.payment_method_id,
      asset_id: txModal.form.asset_id,
      fixed_expense_id: txModal.fixedExpenseId,
    };
    try {
      if (params.editingId)
        await updateTx.mutateAsync({ id: params.editingId, ...payload });
      else await createTx.mutateAsync(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingReturnDate(txModal.form.date || dateParam);
      router.back();
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleTxDelete(id: string) {
    Alert.alert('내역 삭제', '이 내역을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTx.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  function openCatCreate() {
    setTxModal(s => ({
      ...s,
      catEditingId: null,
      catCategoryType: s.form.type,
      catForm: INITIAL_CATEGORY_FORM,
      catFormSource: s.view as 'tx' | 'catMgmt',
    }));
    requestAnimationFrame(() => setTxModal(s => ({ ...s, view: 'catForm' })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openCatEdit(c: Category) {
    setTxModal(s => ({
      ...s,
      catEditingId: c.id,
      catCategoryType: c.type,
      catForm: { name: c.name, icon: c.icon, color: resolveColorKey(c.color) },
      catFormSource: 'catMgmt',
    }));
    requestAnimationFrame(() => setTxModal(s => ({ ...s, view: 'catForm' })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleCatSave() {
    const name = txModal.catForm.name.trim();
    try {
      if (txModal.catEditingId) {
        const origCat = categories.find(c => c.id === txModal.catEditingId);
        if (origCat) {
          const origColor = resolveColorKey(origCat.color);
          const noChange =
            name === origCat.name.trim() &&
            txModal.catForm.icon === origCat.icon &&
            txModal.catForm.color === origColor;
          if (noChange) {
            setTxModal(s => ({ ...s, view: s.catFormSource }));
            return;
          }
        }
        await updateCategory.mutateAsync({
          id: txModal.catEditingId,
          name,
          icon: txModal.catForm.icon,
          color: resolveColor(txModal.catForm.color),
        });
      } else {
        await createCategory.mutateAsync({
          name,
          icon: txModal.catForm.icon,
          color: resolveColor(txModal.catForm.color),
          budget_amount: 0,
          sort_order: categories.length,
          type: txModal.catCategoryType,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTxModal(s => ({ ...s, view: s.catFormSource }));
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
            setTxModal(s => ({ ...s, view: s.catFormSource }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  async function handlePmSave() {
    const name = txModal.pmForm.name.trim();
    const color = getPmColor(txModal.pmForm.type);
    try {
      if (txModal.pmEditingId) {
        const origPm = paymentMethods.find(p => p.id === txModal.pmEditingId);
        if (origPm) {
          const noChange =
            name === origPm.name.trim() && txModal.pmForm.type === origPm.type;
          if (noChange) {
            setTxModal(s => ({
              ...s,
              view: 'pmMgmt',
              pmEditingId: null,
              pmForm: INITIAL_PM_FORM,
            }));
            return;
          }
        }
        await updatePaymentMethod.mutateAsync({
          id: txModal.pmEditingId,
          name,
          type: txModal.pmForm.type,
          color,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTxModal(s => ({
          ...s,
          view: 'pmMgmt',
          pmEditingId: null,
          pmForm: INITIAL_PM_FORM,
        }));
      } else {
        const created = await createPaymentMethod.mutateAsync({
          name,
          type: txModal.pmForm.type,
          color,
          sort_order: paymentMethods.length,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTxModal(s => ({
          ...s,
          view: 'tx',
          pmForm: INITIAL_PM_FORM,
          form: { ...s.form, payment_method_id: created.id },
        }));
      }
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handlePmDelete(id: string) {
    Alert.alert('결제수단 삭제', '이 결제수단을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePaymentMethod.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTxModal(s => ({
              ...s,
              view: 'pmMgmt',
              pmEditingId: null,
              pmForm: INITIAL_PM_FORM,
            }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  return (
    <TransactionFormSheet
      txModal={txModal}
      setTxModal={setTxModal}
      selectedDate={dateParam}
      categories={categories}
      paymentMethods={paymentMethods}
      bankCashAssets={bankCashAssets}
      transactions={transactions}
      tagOptions={tagOptions}
      isTxSaving={isTxSaving}
      isCatSaving={isCatSaving}
      isPmSaving={isPmSaving}
      onClose={() => router.back()}
      onTxSave={handleTxSave}
      onTxDelete={handleTxDelete}
      onCatCreate={openCatCreate}
      onCatEdit={openCatEdit}
      onCatSave={handleCatSave}
      onCatDelete={handleCatDelete}
      onPmSave={handlePmSave}
      onPmDelete={handlePmDelete}
    />
  );
}
