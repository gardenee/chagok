import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useScrollToTop } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useQueryClient } from '@tanstack/react-query';
import { ICON_MAP } from '@/constants/icon-map';
import {
  INITIAL_CATEGORY_FORM,
  CategoryFormScreen,
  type CategoryFormData,
} from '@/components/budget/category-form-screen';
import { INITIAL_PM_FORM, getPmColor } from '@/constants/payment-method';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { resolveColor, resolveColorKey } from '@/constants/color-map';
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
  useUpdateFixedExpense,
} from '@/hooks/use-fixed-expenses';
import { useMonthHolidays } from '@/hooks/use-holidays';
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
import { useMaterializeFixedExpenses } from '@/hooks/use-materialize-fixed-expenses';
import {
  updateLinkedTransactions,
  fetchTransactionById,
} from '@/services/transactions';
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
  type DayCell,
} from '@/components/calendar/types';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { TransactionDetailModal } from '@/components/calendar/transaction-detail-modal';
import { TransactionFormSheet } from '@/components/calendar/transaction-form-sheet';
import { ScheduleFormSheet } from '@/components/calendar/schedule-form-sheet';
import { YearMonthPicker } from '@/components/calendar/year-month-picker';
import {
  FixedExpenseForm,
  type FormData as FixedFormData,
  INITIAL_FORM as INITIAL_FIXED_FORM,
} from '@/components/fixed/fixed-expense-form';
import { CategoryManagementScreen } from '@/components/budget/category-management-screen';
import { Shadows } from '@/constants/shadows';

type FixedEditView = 'form' | 'catMgmt' | 'catForm';

type FixedEditState = {
  visible: boolean;
  view: FixedEditView;
  editingId: string | null;
  form: FixedFormData;
  originalForm: FixedFormData | null;
  catEditingId: string | null;
  catForm: CategoryFormData;
  catFormSource: 'form' | 'catMgmt';
};

const INITIAL_FIXED_EDIT: FixedEditState = {
  visible: false,
  view: 'form',
  editingId: null,
  form: INITIAL_FIXED_FORM,
  originalForm: null,
  catEditingId: null,
  catForm: INITIAL_CATEGORY_FORM,
  catFormSource: 'form',
};

export default function CalendarTab() {
  const todayDate = new Date();
  const todayStr = formatDateStr(todayDate);
  const { session, userProfile } = useAuthStore();
  const myId = session?.user.id ?? '';
  const scrollRef = useRef<ScrollView>(null);
  const listYRef = useRef(0);
  const navigation = useNavigation();
  const router = useRouter();
  const { openTxId } = useLocalSearchParams<{ openTxId?: string }>();
  useScrollToTop(scrollRef);
  const queryClient = useQueryClient();

  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    return navigation.addListener('tabPress' as never, () => {
      if (!navigation.isFocused()) return;
      const now = new Date();
      setCurrentYear(now.getFullYear());
      setCurrentMonth(now.getMonth());
      setSelectedDate(formatDateStr(now));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [navigation]);

  useEffect(() => {
    if (!openTxId) return;
    fetchTransactionById(openTxId).then(tx => {
      if (!tx) {
        Alert.alert('알림', '이미 삭제된 내역이에요');
        return;
      }
      const d = new Date(tx.date);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
      setSelectedDate(tx.date);
      setDetailTx(tx);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: listYRef.current, animated: true });
      });
    });
    router.setParams({ openTxId: undefined });
  }, [openTxId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    detachFixed: false,
  });
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({
    visible: false,
    editingId: null,
    form: INITIAL_SCHEDULE_FORM,
  });
  const [originalTxForm, setOriginalTxForm] = useState<
    TxModalState['form'] | null
  >(null);
  const [originalScheduleForm, setOriginalScheduleForm] = useState<
    ScheduleModalState['form'] | null
  >(null);
  const [detailTx, setDetailTx] = useState<TransactionRow | null>(null);
  const [commentText, setCommentText] = useState('');
  const [fixedEditState, setFixedEditState] =
    useState<FixedEditState>(INITIAL_FIXED_EDIT);
  const [activeTab, setActiveTab] = useState<'ledger' | 'schedule'>('ledger');
  const [yearMonthModal, setYearMonthModal] = useState(false);
  const [pickerYear, setPickerYear] = useState(todayDate.getFullYear());

  // ── 데이터 ──
  const { holidaysByDate } = useMonthHolidays(currentYear, currentMonth);
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
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  const { data: comments = [], isLoading: commentsLoading } =
    useTransactionComments(detailTx?.id ?? '');
  const { data: members = [] } = useCoupleMembers();

  useMaterializeFixedExpenses();

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
    const color = getPmColor(txModal.pmForm.type);
    try {
      if (txModal.pmEditingId) {
        // no-op check
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

  const isTxSaving = createTx.isPending || updateTx.isPending;
  const isScheduleSaving = createSchedule.isPending || updateSchedule.isPending;
  const isCatSaving = createCategory.isPending || updateCategory.isPending;

  // ── 카테고리 핸들러 (거래 폼용) ──
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
        // no-op check
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
    } catch (err) {
      console.error('[handleCatSave]', err);
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

  // ── 고정지출 템플릿 수정 핸들러 ──
  function openFixedTemplateEdit(fixedExpenseId: string) {
    const fe = fixedExpenses.find((f: FixedExpense) => f.id === fixedExpenseId);
    if (!fe) return;
    const fixedForm: FixedFormData = {
      name: fe.name,
      amount: String(fe.amount),
      due_day: fe.due_day,
      due_day_mode: fe.due_day_mode ?? 'day',
      business_day_adjust: fe.business_day_adjust ?? 'none',
      category_id: fe.category_id ?? null,
    };
    setFixedEditState({
      visible: true,
      view: 'form',
      editingId: fe.id,
      form: fixedForm,
      originalForm: fixedForm,
      catEditingId: null,
      catForm: INITIAL_CATEGORY_FORM,
      catFormSource: 'form',
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function closeFixedEdit() {
    setFixedEditState(INITIAL_FIXED_EDIT);
  }

  function openFixedCatCreate() {
    setFixedEditState(s => ({
      ...s,
      catEditingId: null,
      catForm: INITIAL_CATEGORY_FORM,
      catFormSource: s.view === 'catMgmt' ? 'catMgmt' : 'form',
    }));
    requestAnimationFrame(() =>
      setFixedEditState(s => ({ ...s, view: 'catForm' })),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openFixedCatEdit(c: Category) {
    setFixedEditState(s => ({
      ...s,
      catEditingId: c.id,
      catForm: { name: c.name, icon: c.icon, color: resolveColorKey(c.color) },
      catFormSource: 'catMgmt',
    }));
    requestAnimationFrame(() =>
      setFixedEditState(s => ({ ...s, view: 'catForm' })),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function backFromFixedCatForm() {
    setFixedEditState(s => ({ ...s, view: s.catFormSource }));
  }

  async function handleFixedCatSave() {
    const name = fixedEditState.catForm.name.trim();
    try {
      if (fixedEditState.catEditingId) {
        // no-op check
        const origCat = expenseCategories.find(
          c => c.id === fixedEditState.catEditingId,
        );
        if (origCat) {
          const origColor = resolveColorKey(origCat.color);
          const noChange =
            name === origCat.name.trim() &&
            fixedEditState.catForm.icon === origCat.icon &&
            fixedEditState.catForm.color === origColor;
          if (noChange) {
            setFixedEditState(s => ({
              ...s,
              view: s.catFormSource,
              catEditingId: null,
            }));
            return;
          }
        }
        await updateCategory.mutateAsync({
          id: fixedEditState.catEditingId,
          name,
          icon: fixedEditState.catForm.icon,
          color: resolveColor(fixedEditState.catForm.color),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFixedEditState(s => ({
          ...s,
          view: s.catFormSource,
          catEditingId: null,
        }));
      } else {
        const created = await createCategory.mutateAsync({
          name,
          icon: fixedEditState.catForm.icon,
          color: resolveColor(fixedEditState.catForm.color),
          budget_amount: 0,
          sort_order: expenseCategories.length,
          type: 'expense',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFixedEditState(s => ({
          ...s,
          view: s.catFormSource,
          catEditingId: null,
          form: { ...s.form, category_id: created.id },
        }));
      }
    } catch (err) {
      console.error('[handleFixedCatSave]', err);
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleFixedCatDelete(id: string) {
    Alert.alert('카테고리 삭제', '삭제하면 관련 예산도 사라져요. 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setFixedEditState(s => ({
              ...s,
              view: s.catFormSource,
              catEditingId: null,
            }));
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  async function handleFixedTemplateSave() {
    const name = fixedEditState.form.name.trim();
    const amount = parseInt(
      fixedEditState.form.amount.replace(/[^0-9]/g, ''),
      10,
    );
    // no-op check
    if (fixedEditState.originalForm) {
      const orig = fixedEditState.originalForm;
      const noChange =
        name === orig.name.trim() &&
        fixedEditState.form.amount === orig.amount &&
        fixedEditState.form.due_day === orig.due_day &&
        fixedEditState.form.due_day_mode === orig.due_day_mode &&
        fixedEditState.form.business_day_adjust === orig.business_day_adjust &&
        fixedEditState.form.category_id === orig.category_id;
      if (noChange) {
        closeFixedEdit();
        return;
      }
    }

    try {
      await updateFixedExpense.mutateAsync({
        id: fixedEditState.editingId!,
        name,
        amount,
        due_day: fixedEditState.form.due_day,
        due_day_mode: fixedEditState.form.due_day_mode,
        business_day_adjust: fixedEditState.form.business_day_adjust,
        category_id: fixedEditState.form.category_id,
      });
      // Update all linked transactions from current month onward
      const fromDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      await updateLinkedTransactions(
        fixedEditState.editingId!,
        { name, amount, category_id: fixedEditState.form.category_id },
        fromDate,
      );
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeFixedEdit();
    } catch (err) {
      console.error('[handleFixedTemplateSave]', err);
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
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
    return map;
  }, [transactions]);

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
      detachFixed: false,
    }));
    setOriginalTxForm(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openTxEdit(t: TransactionRow) {
    const txForm = {
      amount: String(t.amount),
      type: t.type,
      tag: t.tag,
      memo: t.memo ?? '',
      category_id: t.category_id ?? null,
      payment_method_id: t.payment_method_id ?? null,
      asset_id: t.asset_id ?? null,
    };
    if (t.fixed_expense_id) {
      Alert.alert('수정 방법', '어떻게 수정할까요?', [
        {
          text: '이 내역만',
          onPress: () => {
            setTxModal(s => ({
              ...s,
              visible: true,
              editingId: t.id,
              detachFixed: true,
              form: txForm,
              view: 'tx',
            }));
            setOriginalTxForm(txForm);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: '이후 전체 수정',
          onPress: () => openFixedTemplateEdit(t.fixed_expense_id!),
        },
        { text: '취소', style: 'cancel' },
      ]);
    } else {
      setTxModal(s => ({
        ...s,
        visible: true,
        editingId: t.id,
        detachFixed: false,
        form: txForm,
        view: 'tx',
      }));
      setOriginalTxForm(txForm);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
  async function handleTxSave() {
    const amount = parseInt(txModal.form.amount.replace(/[^0-9]/g, ''), 10);

    // no-op check for edit
    if (txModal.editingId && originalTxForm) {
      const f = txModal.form;
      const noChange =
        f.amount === originalTxForm.amount &&
        f.type === originalTxForm.type &&
        f.tag === originalTxForm.tag &&
        f.memo === originalTxForm.memo &&
        f.category_id === originalTxForm.category_id &&
        f.payment_method_id === originalTxForm.payment_method_id &&
        f.asset_id === originalTxForm.asset_id;
      if (noChange) {
        setTxModal(s => ({ ...s, visible: false, view: 'tx' }));
        return;
      }
    }

    const payload = {
      amount,
      type: txModal.form.type,
      ...(txModal.form.tag ? { tag: txModal.form.tag } : {}),
      memo: txModal.form.memo.trim() || null,
      category_id: txModal.form.category_id,
      payment_method_id: txModal.form.payment_method_id,
      asset_id: txModal.form.asset_id,
      date: selectedDate,
      ...(txModal.detachFixed ? { fixed_expense_id: null } : {}),
    };
    try {
      if (txModal.editingId)
        await updateTx.mutateAsync({ id: txModal.editingId, ...payload });
      else await createTx.mutateAsync(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTxModal(s => ({
        ...s,
        visible: false,
        view: 'tx',
        detachFixed: false,
      }));
    } catch (err) {
      console.error('[handleTxSave] error:', err);
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

  // ── 일정 핸들러 ──
  function openScheduleCreate() {
    setScheduleModal({
      visible: true,
      editingId: null,
      form: INITIAL_SCHEDULE_FORM,
    });
    setOriginalScheduleForm(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openScheduleEdit(s: Schedule) {
    const scheduleForm = {
      title: s.title,
      tag: s.tag,
      time: s.start_time ?? null,
    };
    setScheduleModal({
      visible: true,
      editingId: s.id,
      form: scheduleForm,
    });
    setOriginalScheduleForm(scheduleForm);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleScheduleSave() {
    // no-op check for edit
    if (scheduleModal.editingId && originalScheduleForm) {
      const f = scheduleModal.form;
      const noChange =
        f.title.trim() === originalScheduleForm.title.trim() &&
        f.tag === originalScheduleForm.tag &&
        f.time === originalScheduleForm.time;
      if (noChange) {
        setScheduleModal(s => ({ ...s, visible: false }));
        return;
      }
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
        ref={scrollRef}
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
          holidaysByDate={holidaysByDate}
        />

        {/* 탭 콘텐츠 */}
        <View
          className='mx-4 mt-4'
          onLayout={e => {
            listYRef.current = e.nativeEvent.layout.y;
          }}
        >
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

          {/* 선택일 요약 (가계부 탭만) */}
          {activeTab === 'ledger' && (
            <View className='flex-row gap-3 mb-4'>
              <View
                className='flex-1 bg-peach rounded-2xl px-4 py-3.5'
                style={Shadows.card}
              >
                <Text className='font-ibm-semibold text-sm text-neutral-700'>
                  지출
                </Text>
                <Text className='font-ibm-bold text-xl text-brown-darker mt-0.5'>
                  {totalExpense > 0 ? `-${formatAmount(totalExpense)}원` : '-'}
                </Text>
              </View>
              <View
                className='flex-1 bg-olive rounded-2xl px-4 py-3.5'
                style={Shadows.card}
              >
                <Text className='font-ibm-semibold text-sm text-neutral-700'>
                  수입
                </Text>
                <Text className='font-ibm-bold text-xl text-brown-darker mt-0.5'>
                  {totalIncome > 0 ? `+${formatAmount(totalIncome)}원` : '-'}
                </Text>
              </View>
            </View>
          )}

          {/* 가계부 탭 */}
          {activeTab === 'ledger' &&
            (txLoading ? (
              <LoadingState className='py-6' />
            ) : selectedTransactions.length === 0 ? (
              <EmptyState icon={CalendarX} title='거래 내역이 없어요' />
            ) : (
              <View className='gap-5'>
                {(['income', 'expense'] as const)
                  .map(type => ({
                    type,
                    items: selectedTransactions.filter(t => t.type === type),
                  }))
                  .filter(({ items }) => items.length > 0)
                  .map(({ type, items }) => (
                    <View key={type}>
                      <Text className='font-ibm-bold text-sm text-neutral-500 mb-2 ml-1'>
                        {type === 'expense' ? '지출' : '수입'}
                      </Text>
                      <View className='gap-2.5'>
                        {items.map(t => {
                          const cat = categories.find(
                            c => c.id === t.category_id,
                          );
                          const isFixed = !!t.fixed_expense_id;
                          const CatIcon = cat
                            ? (ICON_MAP[cat.icon] ?? Wallet)
                            : isFixed
                              ? Repeat
                              : Wallet;
                          const catColor = cat
                            ? resolveColor(cat.color)
                            : isFixed
                              ? Colors.peach
                              : '#A3A3A3';
                          const isExpense = t.type === 'expense';
                          return (
                            <ItemCard key={t.id} onPress={() => setDetailTx(t)}>
                              <IconBox color={catColor}>
                                <CatIcon
                                  size={18}
                                  color={catColor}
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
                                  {isFixed ? (
                                    <ColorPill
                                      label='고정지출'
                                      color={Colors.peach}
                                    />
                                  ) : (
                                    <>
                                      {cat && (
                                        <ColorPill
                                          label={cat.name}
                                          color={catColor}
                                        />
                                      )}
                                      <TagPill
                                        tag={t.tag}
                                        label={resolveTagLabel(
                                          t.tag,
                                          t.user_id,
                                        )}
                                        bgColor={resolveTagColor(
                                          t.tag,
                                          t.user_id,
                                        )}
                                      />
                                    </>
                                  )}
                                </View>
                              </View>
                              <Text
                                className={`font-ibm-bold text-sm ${isExpense ? 'text-peach-darker' : 'text-olive-darker'}`}
                              >
                                {isExpense ? '-' : '+'}
                                {formatAmount(t.amount)}원
                              </Text>
                            </ItemCard>
                          );
                        })}
                      </View>
                    </View>
                  ))}
              </View>
            ))}

          {/* 일정 탭 */}
          {activeTab === 'schedule' &&
            (scheduleLoading ? (
              <LoadingState className='py-6' />
            ) : selectedSchedules.length === 0 &&
              !holidaysByDate[selectedDate] ? (
              <EmptyState icon={CalendarDays} title='등록된 일정이 없어요' />
            ) : (
              <View className='gap-2.5'>
                {/* 공휴일 */}
                {holidaysByDate[selectedDate] && (
                  <ItemCard>
                    <TagPill
                      tag='holiday'
                      label='공휴일'
                      className='px-2 py-1'
                    />
                    <Text className='font-ibm-semibold text-base text-peach-darker'>
                      {holidaysByDate[selectedDate]}
                    </Text>
                  </ItemCard>
                )}
                {selectedSchedules.map(s => (
                  <ItemCard key={s.id} onPress={() => openScheduleEdit(s)}>
                    <View className='flex-row items-center gap-3'>
                      <TagPill
                        tag={s.tag}
                        label={resolveTagLabel(s.tag, s.user_id)}
                        bgColor={resolveTagColor(s.tag, s.user_id)}
                        className='px-2 py-1'
                      />
                      <Text className='font-ibm-semibold text-base text-neutral-800'>
                        {s.title}
                      </Text>
                    </View>

                    {s.start_time && (
                      <View className='flex-1 justify-end flex-row items-center gap-1 mt-0.5'>
                        <Clock
                          size={12}
                          color={Colors.neutralLight}
                          strokeWidth={2}
                        />
                        <Text className='font-ibm-regular text-sm text-neutral-500'>
                          {s.start_time}
                        </Text>
                      </View>
                    )}
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

      {/* ── 이후 전체 수정: 고정지출 폼 ── */}
      <Modal
        visible={fixedEditState.visible && fixedEditState.view === 'form'}
        animationType='slide'
        onRequestClose={closeFixedEdit}
      >
        <FixedExpenseForm
          editingId={fixedEditState.editingId}
          form={fixedEditState.form}
          isSaving={updateFixedExpense.isPending}
          categories={expenseCategories}
          onChange={form => setFixedEditState(s => ({ ...s, form }))}
          onClose={closeFixedEdit}
          onSave={handleFixedTemplateSave}
          onCatCreate={openFixedCatCreate}
          onCatMgmt={() => setFixedEditState(s => ({ ...s, view: 'catMgmt' }))}
        />
      </Modal>

      {/* ── 이후 전체 수정: 카테고리 관리 ── */}
      <Modal
        visible={fixedEditState.visible && fixedEditState.view === 'catMgmt'}
        animationType='none'
        onRequestClose={() => setFixedEditState(s => ({ ...s, view: 'form' }))}
      >
        <CategoryManagementScreen
          categories={expenseCategories}
          filterType='expense'
          onBack={() => setFixedEditState(s => ({ ...s, view: 'form' }))}
          onCreate={openFixedCatCreate}
          onEdit={openFixedCatEdit}
          onDelete={handleFixedCatDelete}
        />
      </Modal>

      {/* ── 이후 전체 수정: 카테고리 추가/수정 ── */}
      <Modal
        visible={fixedEditState.visible && fixedEditState.view === 'catForm'}
        animationType='none'
        onRequestClose={backFromFixedCatForm}
      >
        <CategoryFormScreen
          editingId={fixedEditState.catEditingId}
          form={fixedEditState.catForm}
          isSaving={isCatSaving}
          categoryType='expense'
          onBack={backFromFixedCatForm}
          onChange={catForm => setFixedEditState(s => ({ ...s, catForm }))}
          onSave={handleFixedCatSave}
          onDelete={
            fixedEditState.catEditingId
              ? () => handleFixedCatDelete(fixedEditState.catEditingId!)
              : undefined
          }
          onTypeChange={() => {}}
        />
      </Modal>
    </SafeAreaView>
  );
}
