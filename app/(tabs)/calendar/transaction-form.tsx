import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
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
import { RecurringSuggestionSheet } from '@/components/calendar/recurring-suggestion-sheet';
import {
  type TxModalState,
  type TxFormData,
} from '@/components/calendar/types';
import {
  isVariableCategory,
  isWithinAmountTolerance,
  isWithinDateTolerance,
} from '@/constants/recurring-detection';
import {
  fetchPrevMonthMatchingTransactions,
  isAlreadyFixedExpense,
} from '@/services/recurring-detection';
import { useRecurringSuggestionStore } from '@/store/recurring-suggestion';
import { useFixedExpensePrefillStore } from '@/store/fixed-expense-prefill';
import { useCreateFixedExpense } from '@/hooks/use-fixed-expenses';
import { supabase } from '@/lib/supabase';
import type { Asset, Category } from '@/types/database';

type RecurringSuggestion = {
  memo: string;
  amount: number;
  category_id: string | null;
  due_day: number;
};

export default function TransactionFormScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    target_asset_id?: string;
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
  const transferableAssets = allAssets;

  const initialForm: TxFormData = {
    amount: params.amount ?? '',
    type: (params.type as TxFormData['type']) ?? 'expense',
    tag: (params.tag as TxFormData['tag']) || 'me',
    memo: params.memo ?? '',
    date: dateParam,
    category_id: params.category_id || null,
    payment_method_id: params.payment_method_id || null,
    asset_id: params.asset_id || null,
    target_asset_id: params.target_asset_id || null,
    is_fixed: false,
    fixed_due_day: dateParam
      ? parseInt(dateParam.split('-')[2])
      : new Date().getDate(),
    fixed_due_day_mode: 'day',
    fixed_business_day_adjust: 'none',
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
    fixedExpenseType: (params.type as 'expense' | 'transfer') ?? 'expense',
  });

  const setPendingReturnDate = useCalendarStore(s => s.setPendingReturnDate);
  const { isIgnored, addIgnored } = useRecurringSuggestionStore();
  const setPrefill = useFixedExpensePrefillStore(s => s.setPrefill);

  const [recurringSuggestion, setRecurringSuggestion] =
    useState<RecurringSuggestion | null>(null);

  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const createFixedExpense = useCreateFixedExpense();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  const [isSaving, setIsSaving] = useState(false);
  const isTxSaving = createTx.isPending || updateTx.isPending || isSaving;
  const isCatSaving = createCategory.isPending || updateCategory.isPending;
  const isPmSaving =
    createPaymentMethod.isPending || updatePaymentMethod.isPending;

  async function handleTxSave() {
    setIsSaving(true);
    const amount = parseInt(txModal.form.amount.replace(/[^0-9]/g, ''), 10);
    const isTransfer = txModal.form.type === 'transfer';

    if (params.editingId) {
      const noChange =
        txModal.form.amount === initialForm.amount &&
        txModal.form.type === initialForm.type &&
        txModal.form.tag === initialForm.tag &&
        txModal.form.memo === initialForm.memo &&
        txModal.form.date === initialForm.date &&
        txModal.form.category_id === initialForm.category_id &&
        txModal.form.payment_method_id === initialForm.payment_method_id &&
        txModal.form.asset_id === initialForm.asset_id &&
        txModal.form.target_asset_id === initialForm.target_asset_id;
      if (noChange) {
        router.back();
        return;
      }
    }

    const payload = {
      amount,
      type: txModal.form.type,
      ...(!isTransfer && txModal.form.tag ? { tag: txModal.form.tag } : {}),
      memo: txModal.form.memo.trim() || null,
      date: txModal.form.date || dateParam,
      category_id: isTransfer ? null : txModal.form.category_id,
      payment_method_id: isTransfer ? null : txModal.form.payment_method_id,
      asset_id: txModal.form.asset_id,
      target_asset_id:
        isTransfer || txModal.form.type === 'income'
          ? txModal.form.target_asset_id
          : null,
      fixed_expense_id: txModal.fixedExpenseId,
    };

    const isIncome = txModal.form.type === 'income';
    const prevAmount = parseInt(initialForm.amount.replace(/[^0-9]/g, ''), 10);
    const prevHadAssetUpdate =
      initialForm.type === 'transfer' ||
      (initialForm.type === 'income' && !!initialForm.target_asset_id);

    try {
      if (params.editingId) {
        // 수정: 기존 자산 잔액 되돌리기 후 새로 적용
        if (initialForm.type === 'transfer') {
          await supabase.rpc('reverse_transfer', {
            p_from_asset_id: initialForm.asset_id,
            p_to_asset_id: initialForm.target_asset_id,
            p_amount: prevAmount,
          });
        } else if (
          initialForm.type === 'income' &&
          initialForm.target_asset_id
        ) {
          await supabase.rpc('adjust_asset_balance', {
            p_asset_id: initialForm.target_asset_id,
            p_delta: -prevAmount,
          });
        }
        await updateTx.mutateAsync({ id: params.editingId, ...payload });
      } else {
        await createTx.mutateAsync(payload);
      }

      // 이체/수입 저장 후 자산 잔액 자동 반영
      const coupleId = userProfile?.couple_id;
      if (isTransfer) {
        await supabase.rpc('execute_transfer', {
          p_from_asset_id: payload.asset_id ?? null,
          p_to_asset_id: payload.target_asset_id ?? null,
          p_amount: amount,
        });
        if (coupleId) {
          queryClient.invalidateQueries({ queryKey: ['assets', coupleId] });
        }
      } else if (isIncome && payload.target_asset_id) {
        await supabase.rpc('adjust_asset_balance', {
          p_asset_id: payload.target_asset_id,
          p_delta: amount,
        });
        if (coupleId) {
          queryClient.invalidateQueries({ queryKey: ['assets', coupleId] });
        }
      } else if (params.editingId && prevHadAssetUpdate && coupleId) {
        // 이체/수입(자산연결) → 지출 또는 자산 없는 수입으로 변경 시 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['assets', coupleId] });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingReturnDate(txModal.form.date || dateParam);

      // 신규 지출 + 고정지출 동시 등록
      if (
        !params.editingId &&
        txModal.form.is_fixed &&
        payload.type === 'expense'
      ) {
        const fixedDueDay =
          txModal.form.fixed_due_day_mode === 'eom'
            ? 1
            : txModal.form.fixed_due_day;
        await createFixedExpense.mutateAsync({
          type: 'expense',
          name: payload.memo || txModal.form.memo.trim() || '고정지출',
          amount,
          due_day: fixedDueDay,
          due_day_mode: txModal.form.fixed_due_day_mode,
          business_day_adjust: txModal.form.fixed_business_day_adjust,
          category_id: payload.category_id,
          from_asset_id: null,
          to_asset_id: null,
        });
        router.back();
        return;
      }

      // 신규 지출 저장 후 고정지출 패턴 감지
      const shouldDetect =
        !params.editingId &&
        payload.type === 'expense' &&
        !!payload.memo &&
        !!payload.category_id;

      if (shouldDetect) {
        const memo = payload.memo!;
        const categoryId = payload.category_id!;
        const category = categories.find(c => c.id === categoryId);
        const coupleId = userProfile?.couple_id;

        const skipByCategory = category
          ? isVariableCategory(category.name)
          : false;
        const skipByIgnored = isIgnored({ memo, category_id: categoryId });

        if (!skipByCategory && !skipByIgnored && coupleId) {
          const [alreadyFixed, prevMatches] = await Promise.all([
            isAlreadyFixedExpense(coupleId, memo, categoryId),
            fetchPrevMonthMatchingTransactions(
              coupleId,
              memo,
              categoryId,
              parseInt(dateParam.split('-')[0]),
              parseInt(dateParam.split('-')[1]) - 1, // 0-indexed
            ),
          ]);

          if (!alreadyFixed && prevMatches.length > 0) {
            const currentDay = parseInt(dateParam.split('-')[2]);
            const matched = prevMatches.some(
              t =>
                isWithinDateTolerance(
                  currentDay,
                  parseInt(t.date.split('-')[2]),
                ) && isWithinAmountTolerance(amount, t.amount),
            );

            if (matched) {
              setRecurringSuggestion({
                memo,
                amount,
                category_id: categoryId,
                due_day: currentDay,
              });
              return; // router.back() 는 시트 응답 후 처리
            }
          }
        }
      }

      router.back();
    } catch {
      setIsSaving(false);
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleSuggestionRegister() {
    if (!recurringSuggestion) return;
    setPrefill({
      name: recurringSuggestion.memo,
      amount: recurringSuggestion.amount,
      category_id: recurringSuggestion.category_id,
      due_day: recurringSuggestion.due_day,
    });
    setRecurringSuggestion(null);
    router.back();
    router.push('/(tabs)/fixed');
  }

  function handleSuggestionDismiss() {
    if (!recurringSuggestion) return;
    addIgnored({
      memo: recurringSuggestion.memo,
      category_id: recurringSuggestion.category_id,
    });
    setRecurringSuggestion(null);
    router.back();
  }

  function handleTxDelete(id: string) {
    Alert.alert('내역 삭제', '이 내역을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const delAmount = parseInt(
              initialForm.amount.replace(/[^0-9]/g, ''),
              10,
            );
            // 이체/수입 삭제 시 자산 잔액 되돌리기
            if (initialForm.type === 'transfer') {
              await supabase.rpc('reverse_transfer', {
                p_from_asset_id: initialForm.asset_id,
                p_to_asset_id: initialForm.target_asset_id,
                p_amount: delAmount,
              });
              const coupleId = userProfile?.couple_id;
              if (coupleId) {
                queryClient.invalidateQueries({
                  queryKey: ['assets', coupleId],
                });
              }
            } else if (
              initialForm.type === 'income' &&
              initialForm.target_asset_id
            ) {
              await supabase.rpc('adjust_asset_balance', {
                p_asset_id: initialForm.target_asset_id,
                p_delta: -delAmount,
              });
              const coupleId = userProfile?.couple_id;
              if (coupleId) {
                queryClient.invalidateQueries({
                  queryKey: ['assets', coupleId],
                });
              }
            }
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
      catCategoryType: s.form.type === 'transfer' ? 'expense' : s.form.type,
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
    <>
      <TransactionFormSheet
        txModal={txModal}
        setTxModal={setTxModal}
        selectedDate={dateParam}
        categories={categories}
        paymentMethods={paymentMethods}
        bankCashAssets={bankCashAssets}
        allAssets={transferableAssets}
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
      <RecurringSuggestionSheet
        visible={!!recurringSuggestion}
        memo={recurringSuggestion?.memo ?? ''}
        onRegister={handleSuggestionRegister}
        onDismiss={handleSuggestionDismiss}
      />
    </>
  );
}
