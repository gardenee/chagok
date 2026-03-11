import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarX,
  Plus,
  CalendarDays,
  Repeat,
  Wallet,
  Clock,
} from 'lucide-react-native';
import { ICON_MAP } from '@/constants/icon-map';
import {
  INITIAL_CATEGORY_FORM,
  type CategoryFormData,
} from '@/components/budget/category-form-screen';
import {
  INITIAL_PM_FORM,
  getPmColor,
  type PaymentMethodFormData,
} from '@/components/assets/payment-method-form-screen';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import {
  useMonthTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  type TransactionRow,
} from '@/hooks/use-transactions';
import {
  useMonthSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from '@/hooks/use-schedules';
import {
  useTransactionComments,
  useCreateComment,
  useDeleteComment,
} from '@/hooks/use-comments';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import {
  useFixedExpenses,
  useCreateFixedExpense,
  useUpdateFixedExpense,
} from '@/hooks/use-fixed-expenses';
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
import { LoadingState } from '@/components/ui/loading-state';
import { SegmentControl } from '@/components/ui/segment-control';
import { ItemCard } from '@/components/ui/item-card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconBox } from '@/components/ui/icon-box';
import { ColorPill, TagPill } from '@/components/ui/color-pill';
import { formatAmount } from '@/utils/format';
import type { Schedule, FixedExpense, Asset, Category } from '@/types/database';

import {
  formatDateStr,
  getSelectedDateLabel,
  INITIAL_TX_FORM,
  INITIAL_SCHEDULE_FORM,
  type TxModalState,
  type ScheduleModalState,
  type FixedModalState,
  type DayCell,
} from '@/components/calendar/types';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { TransactionDetailModal } from '@/components/calendar/transaction-detail-modal';
import { TransactionFormSheet } from '@/components/calendar/transaction-form-sheet';
import { ScheduleFormSheet } from '@/components/calendar/schedule-form-sheet';
import { YearMonthPicker } from '@/components/calendar/year-month-picker';
import { FixedExpenseFormSheet } from '@/components/calendar/fixed-expense-form-sheet';

export default function CalendarTab() {
  const todayDate = new Date();
  const todayStr = formatDateStr(todayDate);
  const { session, userProfile } = useAuthStore();
  const myId = session?.user.id ?? '';

  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [txModal, setTxModal] = useState<TxModalState>({
    visible: false,
    editingId: null,
    form: INITIAL_TX_FORM,
    view: 'tx',
    catEditingId: null,
    catCategoryType: 'expense',
    catForm: INITIAL_CATEGORY_FORM,
    catFormSource: 'tx',
    pmEditingId: null,
    pmForm: INITIAL_PM_FORM,
  });
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({
    visible: false,
    editingId: null,
    form: INITIAL_SCHEDULE_FORM,
  });
  const [detailTx, setDetailTx] = useState<TransactionRow | null>(null);
  const [commentText, setCommentText] = useState('');
  const [fixedModal, setFixedModal] = useState<FixedModalState>({
    visible: false,
    editingId: null,
    form: { name: '', amount: '', due_day: 1 },
  });
  const [activeTab, setActiveTab] = useState<'ledger' | 'schedule'>('ledger');
  const [yearMonthModal, setYearMonthModal] = useState(false);
  const [pickerYear, setPickerYear] = useState(todayDate.getFullYear());

  // ── 데이터 ──
  const { data: transactions = [], isLoading: txLoading } =
    useMonthTransactions(currentYear, currentMonth);
  const { data: schedules = [], isLoading: scheduleLoading } =
    useMonthSchedules(currentYear, currentMonth);
  const { data: fixedExpenses = [] } = useFixedExpenses();
  const { data: categories = [] } = useCategories();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: allAssets = [] } = useAssets();
  const bankCashAssets = allAssets.filter(
    (a: Asset) => a.type === 'bank' || a.type === 'cash',
  );
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  const { data: comments = [], isLoading: commentsLoading } =
    useTransactionComments(detailTx?.id ?? '');
  const { data: members = [] } = useCoupleMembers();

  const myNickname = userProfile?.nickname ?? '나';
  const partner = members.find(m => m.id !== myId);
  const partnerNickname = partner?.nickname ?? '파트너';

  function resolveTagLabel(
    tag: 'me' | 'partner' | 'together',
    creatorId: string,
  ): string {
    if (tag === 'together') return '함께';
    const createdByMe = creatorId === myId;
    if (createdByMe) return tag === 'me' ? myNickname : partnerNickname;
    return tag === 'me' ? partnerNickname : myNickname;
  }

  function resolveTagColor(
    tag: 'me' | 'partner' | 'together',
    creatorId: string,
  ): string {
    if (tag === 'together') return Colors.lavender;
    const createdByMe = creatorId === myId;
    const isMyExpense =
      (createdByMe && tag === 'me') || (!createdByMe && tag === 'partner');
    return isMyExpense ? Colors.butter : Colors.peach;
  }

  const tagOptions = [
    { value: 'me' as const, label: myNickname },
    { value: 'partner' as const, label: partnerNickname },
    { value: 'together' as const, label: '함께' },
  ];

  const createFixedExpense = useCreateFixedExpense();
  const updateFixedExpense = useUpdateFixedExpense();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // ── 결제수단 핸들러 ──
  async function handlePmSave() {
    const name = txModal.pmForm.name.trim();
    if (!name) {
      Alert.alert('입력 오류', '결제수단 이름을 입력해주세요');
      return;
    }
    const color = getPmColor(txModal.pmForm.type);
    try {
      if (txModal.pmEditingId) {
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

  const isTxSaving = createTx.isPending || updateTx.isPending;
  const isScheduleSaving = createSchedule.isPending || updateSchedule.isPending;
  const isCatSaving = createCategory.isPending || updateCategory.isPending;

  // ── 카테고리 핸들러 ──
  function openCatCreate() {
    setTxModal(s => ({
      ...s,
      view: 'catForm',
      catEditingId: null,
      catCategoryType: s.form.type,
      catForm: INITIAL_CATEGORY_FORM,
      catFormSource: s.view as 'tx' | 'catMgmt',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openCatEdit(c: Category) {
    setTxModal(s => ({
      ...s,
      view: 'catForm',
      catEditingId: c.id,
      catCategoryType: c.type,
      catForm: { name: c.name, icon: c.icon, color: c.color },
      catFormSource: 'catMgmt',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleCatSave() {
    const name = txModal.catForm.name.trim();
    if (!name) {
      Alert.alert('입력 오류', '카테고리 이름을 입력해주세요');
      return;
    }
    try {
      if (txModal.catEditingId) {
        await updateCategory.mutateAsync({
          id: txModal.catEditingId,
          name,
          icon: txModal.catForm.icon,
          color: txModal.catForm.color,
        });
      } else {
        await createCategory.mutateAsync({
          name,
          icon: txModal.catForm.icon,
          color: txModal.catForm.color,
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

  // ── 월 이동 ──
  function prevMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth(m => m - 1);
  }
  function nextMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth(m => m + 1);
  }

  // ── 캘린더 데이터 ──
  const calendarDays = useMemo((): DayCell[] => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days: DayCell[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      days.push({
        date: formatDateStr(
          new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
        ),
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(new Date(currentYear, currentMonth, d));
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: formatDateStr(new Date(currentYear, currentMonth + 1, d)),
        day: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    return days;
  }, [currentYear, currentMonth, todayStr]);

  const transactionsByDate = useMemo(() => {
    const map: Record<string, TransactionRow[]> = {};
    for (const t of transactions) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [transactions]);

  const dailyTotals = useMemo(() => {
    const map: Record<string, { expense: number; income: number }> = {};
    for (const t of transactions) {
      if (!map[t.date]) map[t.date] = { expense: 0, income: 0 };
      if (t.type === 'expense') map[t.date].expense += t.amount;
      else map[t.date].income += t.amount;
    }
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (const fe of fixedExpenses) {
      if (fe.due_day <= daysInMonth) {
        const m = String(currentMonth + 1).padStart(2, '0');
        const d = String(fe.due_day).padStart(2, '0');
        const dateStr = `${currentYear}-${m}-${d}`;
        if (!map[dateStr]) map[dateStr] = { expense: 0, income: 0 };
        map[dateStr].expense += fe.amount;
      }
    }
    return map;
  }, [transactions, fixedExpenses, currentYear, currentMonth]);

  const schedulesByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    for (const s of schedules) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [schedules]);

  const selectedTransactions = transactionsByDate[selectedDate] ?? [];
  const selectedSchedules = useMemo(() => {
    const list = schedulesByDate[selectedDate] ?? [];
    return [...list].sort((a, b) => {
      const aTime = a.start_time ?? null;
      const bTime = b.start_time ?? null;
      if (aTime && bTime) return aTime.localeCompare(bTime);
      if (aTime) return -1;
      if (bTime) return 1;
      return 0;
    });
  }, [schedulesByDate, selectedDate]);
  const selectedDay = parseInt(selectedDate.split('-')[2], 10);
  const selectedFixedExpenses = fixedExpenses.filter(
    fe => fe.due_day === selectedDay,
  );
  const totalExpense = selectedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = selectedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // ── 거래 핸들러 ──
  function openTxCreate() {
    setTxModal(s => ({
      ...s,
      visible: true,
      editingId: null,
      form: INITIAL_TX_FORM,
      view: 'tx',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openTxEdit(t: TransactionRow) {
    setTxModal(s => ({
      ...s,
      visible: true,
      editingId: t.id,
      form: {
        amount: String(t.amount),
        type: t.type,
        tag: t.tag,
        memo: t.memo ?? '',
        category_id: t.category_id ?? null,
        payment_method_id: t.payment_method_id ?? null,
        asset_id: t.asset_id ?? null,
      },
      view: 'tx',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleTxSave() {
    const amount = parseInt(txModal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) {
      Alert.alert('입력 오류', '금액을 올바르게 입력해주세요');
      return;
    }
    const payload = {
      amount,
      type: txModal.form.type,
      tag: txModal.form.tag,
      memo: txModal.form.memo.trim() || null,
      category_id: txModal.form.category_id,
      payment_method_id: txModal.form.payment_method_id,
      asset_id: txModal.form.asset_id,
      date: selectedDate,
    };
    try {
      if (txModal.editingId)
        await updateTx.mutateAsync({ id: txModal.editingId, ...payload });
      else await createTx.mutateAsync(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTxModal(s => ({ ...s, visible: false, view: 'tx' }));
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
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  // ── 고정지출 핸들러 ──
  function openFixedCreate() {
    setFixedModal({
      visible: true,
      editingId: null,
      form: { name: '', amount: '', due_day: selectedDay },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openFixedEdit(fe: FixedExpense) {
    setFixedModal({
      visible: true,
      editingId: fe.id,
      form: { name: fe.name, amount: String(fe.amount), due_day: fe.due_day },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleFixedSave() {
    const amount = parseInt(fixedModal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (!fixedModal.form.name.trim()) {
      Alert.alert('입력 오류', '이름을 입력해주세요');
      return;
    }
    if (!amount || amount <= 0) {
      Alert.alert('입력 오류', '금액을 올바르게 입력해주세요');
      return;
    }
    try {
      if (fixedModal.editingId) {
        await updateFixedExpense.mutateAsync({
          id: fixedModal.editingId,
          name: fixedModal.form.name.trim(),
          amount,
          due_day: fixedModal.form.due_day,
        });
      } else {
        await createFixedExpense.mutateAsync({
          name: fixedModal.form.name.trim(),
          amount,
          due_day: fixedModal.form.due_day,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFixedModal(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  // ── 일정 핸들러 ──
  function openScheduleCreate() {
    setScheduleModal({
      visible: true,
      editingId: null,
      form: INITIAL_SCHEDULE_FORM,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openScheduleEdit(s: Schedule) {
    setScheduleModal({
      visible: true,
      editingId: s.id,
      form: { title: s.title, tag: s.tag, time: s.start_time ?? null },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleScheduleSave() {
    if (!scheduleModal.form.title.trim()) {
      Alert.alert('입력 오류', '일정 제목을 입력해주세요');
      return;
    }
    const payload = {
      title: scheduleModal.form.title.trim(),
      tag: scheduleModal.form.tag,
      date: selectedDate,
      start_time: scheduleModal.form.time ?? null,
    };
    try {
      if (scheduleModal.editingId)
        await updateSchedule.mutateAsync({
          id: scheduleModal.editingId,
          ...payload,
        });
      else await createSchedule.mutateAsync(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScheduleModal(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }
  function handleScheduleDelete(id: string) {
    Alert.alert('일정 삭제', '이 일정을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSchedule.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  // ── 댓글 핸들러 ──
  async function handleCommentSend() {
    if (!commentText.trim() || !detailTx) return;
    const txId = detailTx.id;
    const text = commentText.trim();
    setCommentText('');
    try {
      await createComment.mutateAsync({
        transactionId: txId,
        content: text,
      });
    } catch {
      setCommentText(text);
      Alert.alert('오류', '댓글 전송 중 문제가 발생했어요');
    }
  }
  function handleCommentDelete(commentId: string) {
    if (!detailTx) return;
    Alert.alert('댓글 삭제', '이 댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment.mutateAsync({
              id: commentId,
              transactionId: detailTx.id,
            });
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
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* 월 헤더 */}
        <View className='flex-row items-center justify-between px-6 pt-6 pb-2'>
          <TouchableOpacity
            onPress={prevMonth}
            className='w-10 h-10 items-center justify-center'
            activeOpacity={0.6}
          >
            <ChevronLeft
              size={22}
              color={Colors.brownDarker}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setPickerYear(currentYear);
              setYearMonthModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text className='font-ibm-bold text-2xl text-brown-darker'>
              {currentYear}년 {currentMonth + 1}월
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={nextMonth}
            className='w-10 h-10 items-center justify-center'
            activeOpacity={0.6}
          >
            <ChevronRight
              size={22}
              color={Colors.brownDarker}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>

        {/* 탭 전환 */}
        <SegmentControl
          options={[
            { value: 'ledger', label: '가계부' },
            { value: 'schedule', label: '일정' },
          ]}
          value={activeTab}
          onChange={tab => {
            setActiveTab(tab as 'ledger' | 'schedule');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          className='flex-1 mx-4 mb-3 mr-3'
        />

        {/* 캘린더 그리드 */}
        <CalendarGrid
          calendarDays={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={(date, isCurrentMonth) => {
            if (!isCurrentMonth) {
              const d = new Date(date);
              setCurrentYear(d.getFullYear());
              setCurrentMonth(d.getMonth());
            }
            setSelectedDate(date);
          }}
          activeTab={activeTab}
          dailyTotals={dailyTotals}
          schedulesByDate={schedulesByDate}
        />

        {/* 선택일 요약 (가계부 탭만) */}
        {activeTab === 'ledger' && (
          <View className='mx-4 mt-4 flex-row gap-3'>
            <View className='flex-1 bg-peach/70 rounded-2xl px-4 py-3.5'>
              <Text className='font-ibm-semibold text-xs text-neutral-600'>
                지출
              </Text>
              <Text className='font-ibm-bold text-base text-brown-darker mt-0.5'>
                {totalExpense > 0 ? `-${formatAmount(totalExpense)}원` : '-'}
              </Text>
            </View>
            <View className='flex-1 bg-olive/50 rounded-2xl px-4 py-3.5'>
              <Text className='font-ibm-semibold text-xs text-neutral-600'>
                수입
              </Text>
              <Text className='font-ibm-bold text-base text-brown-darker mt-0.5'>
                {totalIncome > 0 ? `+${formatAmount(totalIncome)}원` : '-'}
              </Text>
            </View>
          </View>
        )}

        {/* 탭 콘텐츠 */}
        <View className='mx-4 mt-4'>
          <View className='flex-row items-center justify-between mb-3'>
            <Text className='font-ibm-bold text-base text-neutral-700'>
              {getSelectedDateLabel(selectedDate)}{' '}
              {activeTab === 'ledger' ? '거래내역' : '일정목록'}
            </Text>
            {activeTab === 'ledger' ? (
              <TouchableOpacity
                onPress={openTxCreate}
                className='w-8 h-8 rounded-full items-center justify-center'
                activeOpacity={0.6}
              >
                <Plus size={16} color={Colors.brownDark} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={openScheduleCreate}
                className='w-8 h-8 rounded-full items-center justify-center'
                activeOpacity={0.6}
              >
                <Plus size={16} color={Colors.brownDark} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* 가계부 탭 */}
          {activeTab === 'ledger' &&
            (txLoading ? (
              <LoadingState className='py-6' />
            ) : selectedTransactions.length === 0 &&
              selectedFixedExpenses.length === 0 ? (
              <EmptyState icon={CalendarX} title='거래 내역이 없어요' />
            ) : (
              <View className='gap-2.5'>
                {selectedTransactions.map(t => {
                  const cat = categories.find(c => c.id === t.category_id);
                  const CatIcon = cat ? (ICON_MAP[cat.icon] ?? Wallet) : Wallet;
                  const isExpense = t.type === 'expense';
                  return (
                    <ItemCard key={t.id} onPress={() => setDetailTx(t)}>
                      <IconBox color={cat?.color ?? '#A3A3A3'}>
                        <CatIcon
                          size={18}
                          color={cat ? cat.color : '#A3A3A3'}
                          strokeWidth={2.5}
                        />
                      </IconBox>
                      <View className='flex-1'>
                        <Text
                          className='font-ibm-semibold text-sm text-neutral-800'
                          numberOfLines={1}
                        >
                          {t.memo ?? cat?.name ?? '기타'}
                        </Text>
                        <View className='flex-row items-center gap-1.5 mt-0.5'>
                          {cat && (
                            <ColorPill label={cat.name} color={cat.color} />
                          )}
                          <TagPill
                            tag={t.tag}
                            label={resolveTagLabel(t.tag, t.user_id)}
                            bgColor={resolveTagColor(t.tag, t.user_id)}
                          />
                        </View>
                      </View>
                      <Text
                        className={`font-ibm-bold text-sm ${isExpense ? 'text-peach-dark' : 'text-olive-dark'}`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatAmount(t.amount)}원
                      </Text>
                    </ItemCard>
                  );
                })}
                {selectedFixedExpenses.map(fe => (
                  <ItemCard key={fe.id} onPress={() => openFixedEdit(fe)}>
                    <View className='w-10 h-10 rounded-2xl items-center justify-center bg-peach/30'>
                      <Repeat
                        size={18}
                        color={Colors.peach}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View className='flex-1'>
                      <Text className='font-ibm-semibold text-sm text-neutral-800'>
                        {fe.name}
                      </Text>
                      <View className='flex-row items-center mt-0.5'>
                        <ColorPill label='고정지출' color={Colors.peach} />
                      </View>
                    </View>
                    <Text className='font-ibm-bold text-sm text-neutral-800'>
                      {formatAmount(fe.amount)}원
                    </Text>
                  </ItemCard>
                ))}
              </View>
            ))}

          {/* 일정 탭 */}
          {activeTab === 'schedule' &&
            (scheduleLoading ? (
              <LoadingState className='py-6' />
            ) : selectedSchedules.length === 0 ? (
              <EmptyState icon={CalendarDays} title='등록된 일정이 없어요' />
            ) : (
              <View className='gap-2.5'>
                {selectedSchedules.map(s => (
                  <ItemCard key={s.id} onPress={() => openScheduleEdit(s)}>
                    <View
                      className='w-10 h-10 rounded-2xl items-center justify-center'
                      style={{
                        backgroundColor:
                          {
                            me: '#FAD97A',
                            partner: '#F7B8A0',
                            together: '#D4C5F0',
                          }[s.tag] + '80',
                      }}
                    >
                      <CalendarDays
                        size={18}
                        color={Colors.brown}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View className='flex-1'>
                      <Text className='font-ibm-semibold text-sm text-neutral-800'>
                        {s.title}
                      </Text>
                      {s.start_time && (
                        <View className='flex-row items-center gap-1 mt-0.5'>
                          <Clock size={10} color='#a3a3a3' strokeWidth={2} />
                          <Text className='font-ibm-regular text-xs text-neutral-400'>
                            {s.start_time}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TagPill
                      tag={s.tag}
                      label={resolveTagLabel(s.tag, s.user_id)}
                      bgColor={resolveTagColor(s.tag, s.user_id)}
                      className='px-2 py-1'
                    />
                  </ItemCard>
                ))}
              </View>
            ))}
        </View>
      </ScrollView>

      {/* 거래 추가/수정 + 카테고리/결제수단 관리 */}
      <TransactionFormSheet
        txModal={txModal}
        setTxModal={setTxModal}
        selectedDate={selectedDate}
        categories={categories}
        paymentMethods={paymentMethods}
        bankCashAssets={bankCashAssets}
        tagOptions={tagOptions}
        isTxSaving={isTxSaving}
        isCatSaving={isCatSaving}
        isPmSaving={
          createPaymentMethod.isPending || updatePaymentMethod.isPending
        }
        onTxSave={handleTxSave}
        onTxDelete={handleTxDelete}
        onCatCreate={openCatCreate}
        onCatEdit={openCatEdit}
        onCatSave={handleCatSave}
        onCatDelete={handleCatDelete}
        onPmSave={handlePmSave}
        onPmDelete={handlePmDelete}
      />

      {/* 일정 추가/수정 */}
      <ScheduleFormSheet
        scheduleModal={scheduleModal}
        onClose={() => setScheduleModal(s => ({ ...s, visible: false }))}
        onFormChange={form => setScheduleModal(s => ({ ...s, form }))}
        onSave={handleScheduleSave}
        onDelete={scheduleModal.editingId ? handleScheduleDelete : undefined}
        tagOptions={tagOptions}
        isSaving={isScheduleSaving}
      />

      {/* 년월 선택 */}
      <YearMonthPicker
        visible={yearMonthModal}
        onClose={() => setYearMonthModal(false)}
        pickerYear={pickerYear}
        onPickerYearChange={setPickerYear}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onSelectMonth={(year, month) => {
          setCurrentYear(year);
          setCurrentMonth(month);
          setYearMonthModal(false);
        }}
        onGoToday={() => {
          setPickerYear(todayDate.getFullYear());
          setCurrentYear(todayDate.getFullYear());
          setCurrentMonth(todayDate.getMonth());
          setYearMonthModal(false);
        }}
      />

      {/* 고정지출 수정 */}
      <FixedExpenseFormSheet
        fixedModal={fixedModal}
        onClose={() => setFixedModal(s => ({ ...s, visible: false }))}
        onChange={form => setFixedModal(s => ({ ...s, form }))}
        onSave={handleFixedSave}
        isSaving={createFixedExpense.isPending || updateFixedExpense.isPending}
      />

      {/* 거래 상세 + 댓글 */}
      <TransactionDetailModal
        detailTx={detailTx}
        onClose={() => setDetailTx(null)}
        onEdit={openTxEdit}
        myId={myId}
        comments={comments}
        commentsLoading={commentsLoading}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onCommentSend={handleCommentSend}
        onCommentDelete={handleCommentDelete}
        isCommentSending={createComment.isPending}
        resolveTagLabel={resolveTagLabel}
        resolveTagColor={resolveTagColor}
      />
    </SafeAreaView>
  );
}
