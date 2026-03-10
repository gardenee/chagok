import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  BottomSheet,
  BottomSheetHeader,
} from '../../components/ui/bottom-sheet';
import { SaveButton } from '../../components/ui/save-button';
import { ModalTextInput, AmountInput } from '../../components/ui/modal-inputs';
import { LoadingState } from '../../components/ui/loading-state';
import { ItemCard } from '../../components/ui/item-card';
import { useState, useMemo, useRef } from 'react';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  CalendarX,
  Plus,
  Trash2,
  Send,
  CalendarDays,
  Repeat,
  Wallet,
  Clock,
  X,
} from 'lucide-react-native';
import {
  CategoryFormScreen,
  ICON_MAP,
  CategoryFormData,
  INITIAL_CATEGORY_FORM,
} from '../../components/ui/category-form-screen';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';
import {
  useMonthTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  type TransactionRow,
} from '../../hooks/use-transactions';
import {
  useMonthSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from '../../hooks/use-schedules';
import {
  useTransactionComments,
  useCreateComment,
  useDeleteComment,
} from '../../hooks/use-comments';
import { useCoupleMembers } from '../../hooks/use-couple-members';
import {
  useFixedExpenses,
  useCreateFixedExpense,
  useUpdateFixedExpense,
} from '../../hooks/use-fixed-expenses';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/use-categories';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '../../hooks/use-payment-methods';
import { useAssets } from '../../hooks/use-assets';
import { getAssetTypeOption } from '../../components/ui/asset-payment-form-screen';
import {
  PaymentMethodFormScreen,
  PM_TYPE_OPTIONS,
  INITIAL_PM_FORM,
  getPmColor,
  type PaymentMethodFormData,
} from '../../components/ui/payment-method-form-screen';
import { EmptyState } from '../../components/ui/empty-state';
import { IconBox } from '../../components/ui/icon-box';
import { SegmentControl } from '../../components/ui/segment-control';
import { ColorPill, TagPill } from '../../components/ui/color-pill';
import { formatAmount, formatAmountShort } from '../../utils/format';
import type {
  Schedule,
  FixedExpense,
  PaymentMethod,
  Asset,
} from '../../types/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type TxFormData = {
  amount: string;
  type: 'expense' | 'income';
  tag: 'me' | 'partner' | 'together';
  memo: string;
  category_id: string | null;
  payment_method_id: string | null;
  asset_id: string | null;
};

type ScheduleFormData = {
  title: string;
  tag: 'me' | 'partner' | 'together';
  time: string | null;
};

const INITIAL_TX_FORM: TxFormData = {
  amount: '',
  type: 'expense',
  tag: 'me',
  memo: '',
  category_id: null,
  payment_method_id: null,
  asset_id: null,
};
const INITIAL_SCHEDULE_FORM: ScheduleFormData = {
  title: '',
  tag: 'me',
  time: null,
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTagBgColor(tag: 'me' | 'partner' | 'together'): string {
  return { me: '#FAD97A', partner: '#F7B8A0', together: '#D4C5F0' }[tag];
}

function getSelectedDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

interface DayCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function CalendarTab() {
  const insets = useSafeAreaInsets();
  const todayDate = new Date();
  const todayStr = formatDate(todayDate);
  const { session, userProfile } = useAuthStore();
  const myId = session?.user.id ?? '';

  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [txModal, setTxModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: TxFormData;
    view: 'tx' | 'catMgmt' | 'catForm' | 'pmMgmt' | 'pmForm';
    catEditingId: string | null;
    catForm: CategoryFormData;
    catFormSource: 'tx' | 'catMgmt';
    pmEditingId: string | null;
    pmForm: PaymentMethodFormData;
  }>({
    visible: false,
    editingId: null,
    form: INITIAL_TX_FORM,
    view: 'tx',
    catEditingId: null,
    catForm: INITIAL_CATEGORY_FORM,
    catFormSource: 'tx',
    pmEditingId: null,
    pmForm: INITIAL_PM_FORM,
  });
  const [scheduleModal, setScheduleModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: ScheduleFormData;
  }>({
    visible: false,
    editingId: null,
    form: INITIAL_SCHEDULE_FORM,
  });
  const [detailTx, setDetailTx] = useState<TransactionRow | null>(null);
  const [commentText, setCommentText] = useState('');
  const [fixedModal, setFixedModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: { name: string; amount: string; due_day: number };
  }>({
    visible: false,
    editingId: null,
    form: { name: '', amount: '', due_day: 1 },
  });
  const [activeTab, setActiveTab] = useState<'ledger' | 'schedule'>('ledger');
  const [yearMonthModal, setYearMonthModal] = useState(false);
  const [pickerYear, setPickerYear] = useState(todayDate.getFullYear());
  const commentScrollRef = useRef<ScrollView>(null);

  const detailPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 60 || g.vy > 0.8) setDetailTx(null);
      },
    }),
  ).current;

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

  // 태그를 실제 닉네임으로 변환 (작성자 기준)
  function resolveTagLabel(
    tag: 'me' | 'partner' | 'together',
    creatorId: string,
  ): string {
    if (tag === 'together') return '함께';
    const createdByMe = creatorId === myId;
    if (createdByMe) return tag === 'me' ? myNickname : partnerNickname;
    return tag === 'me' ? partnerNickname : myNickname;
  }

  // 실제 소비 주체 기준으로 태그 색상 결정 (이름과 색이 일치하도록)
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

  // 모달 태그 옵션 (닉네임으로 표시)
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

  function openCatCreate() {
    setTxModal(s => ({
      ...s,
      view: 'catForm',
      catEditingId: null,
      catForm: INITIAL_CATEGORY_FORM,
      catFormSource: s.view as 'tx' | 'catMgmt',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openCatEdit(c: {
    id: string;
    name: string;
    icon: string;
    color: string;
    budget_amount: number;
  }) {
    setTxModal(s => ({
      ...s,
      view: 'catForm',
      catEditingId: c.id,
      catForm: {
        name: c.name,
        icon: c.icon,
        color: c.color,
        budget_amount: String(c.budget_amount),
      },
      catFormSource: 'catMgmt',
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleCatSave() {
    const name = txModal.catForm.name.trim();
    const isIncome = txModal.form.type === 'income';
    const amount = isIncome
      ? 0
      : parseInt(txModal.catForm.budget_amount.replace(/[^0-9]/g, ''), 10);
    if (!name) {
      Alert.alert('입력 오류', '카테고리 이름을 입력해주세요');
      return;
    }
    if (!isIncome && (!amount || amount <= 0)) {
      Alert.alert('입력 오류', '예산을 올바르게 입력해주세요');
      return;
    }
    try {
      if (txModal.catEditingId) {
        await updateCategory.mutateAsync({
          id: txModal.catEditingId,
          name,
          icon: txModal.catForm.icon,
          color: txModal.catForm.color,
          budget_amount: amount,
        });
      } else {
        await createCategory.mutateAsync({
          name,
          icon: txModal.catForm.icon,
          color: txModal.catForm.color,
          budget_amount: amount,
          sort_order: categories.length,
          type: txModal.form.type,
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

  const calendarDays = useMemo((): DayCell[] => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days: DayCell[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      days.push({
        date: formatDate(
          new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
        ),
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(currentYear, currentMonth, d));
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
        date: formatDate(new Date(currentYear, currentMonth + 1, d)),
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

  // 가계부 탭용: 날짜별 지출/수입 합계 (고정지출 포함)
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
  function adjustScheduleHour(delta: number) {
    setScheduleModal(s => {
      const [hStr, mStr] = (s.form.time ?? '09:00').split(':');
      const h = (parseInt(hStr) + delta + 24) % 24;
      return {
        ...s,
        form: { ...s.form, time: `${String(h).padStart(2, '0')}:${mStr}` },
      };
    });
  }
  function adjustScheduleMinute(delta: number) {
    setScheduleModal(s => {
      const [hStr, mStr] = (s.form.time ?? '09:00').split(':');
      const m = (parseInt(mStr) + delta + 60) % 60;
      return {
        ...s,
        form: { ...s.form, time: `${hStr}:${String(m).padStart(2, '0')}` },
      };
    });
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
      setTimeout(
        () => commentScrollRef.current?.scrollToEnd({ animated: true }),
        50,
      );
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
        <View className='flex-1 flex-row mx-4 mb-3 bg-cream rounded-2xl p-1 mr-3'>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('ledger');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'ledger' ? 'bg-butter' : ''}`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-ibm-semibold text-sm ${activeTab === 'ledger' ? 'text-brown' : 'text-brown/40'}`}
            >
              가계부
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('schedule');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'schedule' ? 'bg-butter' : ''}`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-ibm-semibold text-sm ${activeTab === 'schedule' ? 'text-brown' : 'text-brown/40'}`}
            >
              일정
            </Text>
          </TouchableOpacity>
        </View>

        {/* 캘린더 카드 */}
        <View
          className='mx-4 mt-3 bg-white rounded-3xl p-4'
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <View className='flex-row mb-1'>
            {WEEKDAYS.map((day, i) => (
              <View key={day} className='flex-1 items-center py-1.5'>
                <Text
                  className={`font-ibm-semibold text-xs ${i === 0 ? 'text-peach-dark' : 'text-neutral-600'}`}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <View className='flex-row flex-wrap'>
            {calendarDays.map((item, index) => {
              const isSelected = item.date === selectedDate;
              const col = index % 7;
              // 가계부 탭용
              const dayTotals = dailyTotals[item.date];
              const dayExpense = dayTotals?.expense ?? 0;
              const dayIncome = dayTotals?.income ?? 0;
              // 일정 탭용 — 2행×3열, 최대 5도트 + +n
              const daySchedules = schedulesByDate[item.date] ?? [];
              const hasExtraDots = daySchedules.length > 6;
              const visibleDots = hasExtraDots
                ? daySchedules.slice(0, 5)
                : daySchedules;
              const extraDotCount = hasExtraDots ? daySchedules.length - 5 : 0;
              const dotRow1 = visibleDots.slice(0, 3);
              const dotRow2 = visibleDots.slice(3);
              return (
                <TouchableOpacity
                  key={`${item.date}-${index}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (!item.isCurrentMonth) {
                      const d = new Date(item.date);
                      setCurrentYear(d.getFullYear());
                      setCurrentMonth(d.getMonth());
                    }
                    setSelectedDate(item.date);
                  }}
                  className='w-[14.28%] items-center'
                  style={{
                    paddingVertical: 3,
                    opacity: item.isCurrentMonth ? 1 : 0.35,
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-butter' : item.isToday ? 'bg-butter/40' : ''}`}
                    style={
                      isSelected
                        ? {
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 2 },
                          }
                        : {}
                    }
                  >
                    <Text
                      className={`font-ibm-semibold text-sm ${
                        isSelected
                          ? 'text-brown-darker'
                          : col === 0
                            ? 'text-peach-dark'
                            : 'text-neutral-800'
                      }`}
                    >
                      {item.day}
                    </Text>
                  </View>
                  {/* 날짜 셀 하단 — 두 탭 height 동일 */}
                  {activeTab === 'ledger' ? (
                    <View
                      className='w-full items-center'
                      style={{ height: 30, overflow: 'hidden', paddingTop: 2 }}
                    >
                      {item.isCurrentMonth && dayExpense > 0 && (
                        <Text
                          className='font-ibm-bold text-peach-dark text-center'
                          style={{ fontSize: 10, lineHeight: 14 }}
                          numberOfLines={1}
                        >
                          -{formatAmountShort(dayExpense)}
                        </Text>
                      )}
                      {item.isCurrentMonth && dayIncome > 0 && (
                        <Text
                          className='font-ibm-bold text-olive-dark text-center'
                          style={{ fontSize: 10, lineHeight: 14 }}
                          numberOfLines={1}
                        >
                          +{formatAmountShort(dayIncome)}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View
                      className='w-full items-center justify-center'
                      style={{ height: 30, gap: 3 }}
                    >
                      {item.isCurrentMonth && dotRow1.length > 0 && (
                        <View
                          className='flex-row justify-center'
                          style={{ gap: 3 }}
                        >
                          {dotRow1.map(s => (
                            <View
                              key={s.id}
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 3.5,
                                backgroundColor: getTagBgColor(s.tag),
                              }}
                            />
                          ))}
                        </View>
                      )}
                      {item.isCurrentMonth &&
                        (dotRow2.length > 0 || extraDotCount > 0) && (
                          <View
                            className='flex-row justify-center items-center'
                            style={{ gap: 3 }}
                          >
                            {dotRow2.map(s => (
                              <View
                                key={s.id}
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: 3.5,
                                  backgroundColor: getTagBgColor(s.tag),
                                }}
                              />
                            ))}
                            {extraDotCount > 0 && (
                              <Text
                                className='font-ibm-semibold text-neutral-600'
                                style={{ fontSize: 10, lineHeight: 14 }}
                              >
                                +{extraDotCount}
                              </Text>
                            )}
                          </View>
                        )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
          {/* 헤더 */}
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
                      style={{ backgroundColor: getTagBgColor(s.tag) + '80' }}
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

      {/* ── 거래 추가/수정 모달 (half-sheet) ── */}
      <BottomSheet
        visible={txModal.visible && txModal.view === 'tx'}
        onClose={() => setTxModal(s => ({ ...s, visible: false, view: 'tx' }))}
      >
        <BottomSheetHeader
          title={
            txModal.editingId
              ? '내역 수정'
              : `${getSelectedDateLabel(selectedDate)} 내역 추가`
          }
          onClose={() =>
            setTxModal(s => ({ ...s, visible: false, view: 'tx' }))
          }
          onDelete={
            txModal.editingId
              ? () => handleTxDelete(txModal.editingId!)
              : undefined
          }
          className='mb-5'
        />

        <SegmentControl
          options={[
            { value: 'expense' as const, label: '지출' },
            { value: 'income' as const, label: '수입' },
          ]}
          value={txModal.form.type}
          onChange={type =>
            setTxModal(s => ({ ...s, form: { ...s.form, type } }))
          }
          bgClassName='bg-neutral-100 rounded-2xl'
          className='mb-5'
          activeTextClassName='text-neutral-800'
          inactiveTextClassName='text-neutral-500'
        />

        <AmountInput
          value={txModal.form.amount}
          onChangeText={v =>
            setTxModal(s => ({ ...s, form: { ...s.form, amount: v } }))
          }
          className='mb-3'
        />

        <ModalTextInput
          value={txModal.form.memo}
          onChangeText={v =>
            setTxModal(s => ({ ...s, form: { ...s.form, memo: v } }))
          }
          placeholder='메모 (선택)'
          maxLength={50}
          className='mb-4'
        />

        {/* 카테고리 선택 */}
        <View className='mb-4'>
          <View className='flex-row items-center justify-between mb-2 ml-1 mr-1'>
            <Text className='font-ibm-semibold text-xs text-neutral-600'>
              카테고리
            </Text>
            {categories.length > 0 && (
              <TouchableOpacity
                onPress={() => setTxModal(s => ({ ...s, view: 'catMgmt' }))}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className='font-ibm-semibold text-xs text-neutral-600 bg-neutral-200 rounded-2xl px-2 py-0.5'>
                  수정
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            <View className='flex-row gap-2 pr-2'>
              {categories
                .filter(c => c.type === txModal.form.type)
                .map(c => {
                  const Icon = ICON_MAP[c.icon] ?? Wallet;
                  const isSelected = txModal.form.category_id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setTxModal(s => ({
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
              <TouchableOpacity
                onPress={openCatCreate}
                className='items-center gap-1'
                activeOpacity={0.7}
              >
                <View className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100 border border-dashed border-neutral-300'>
                  <Plus size={18} color='#A3A3A3' strokeWidth={2} />
                </View>
                <Text className='font-ibm-semibold text-[10px] text-neutral-600'>
                  추가
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* 결제수단 선택 (지출일 때) */}
        {txModal.form.type === 'expense' && (
          <View className='mb-4'>
            <View className='flex-row items-center justify-between mb-2 ml-1 mr-1'>
              <Text className='font-ibm-semibold text-xs text-neutral-600'>
                결제수단
              </Text>
              {paymentMethods.length > 0 && (
                <TouchableOpacity
                  onPress={() => setTxModal(s => ({ ...s, view: 'pmMgmt' }))}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className='font-ibm-semibold text-xs text-neutral-600 bg-neutral-200 rounded-2xl px-2 py-0.5'>
                    수정
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            >
              <View className='flex-row gap-2 pr-2'>
                {paymentMethods.map(pm => {
                  const isSelected = txModal.form.payment_method_id === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => {
                        setTxModal(s => ({
                          ...s,
                          form: {
                            ...s.form,
                            payment_method_id: isSelected ? null : pm.id,
                            asset_id: null,
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
                          backgroundColor: pm.color + '50',
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: isSelected ? pm.color : 'transparent',
                        }}
                      >
                        <Wallet size={20} color={pm.color} strokeWidth={2.5} />
                      </View>
                      <Text
                        className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                        numberOfLines={1}
                      >
                        {pm.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {bankCashAssets.map((asset: Asset) => {
                  const isSelected = txModal.form.asset_id === asset.id;
                  const { Icon: AssetIcon, color: assetColor } =
                    getAssetTypeOption(asset.type);
                  return (
                    <TouchableOpacity
                      key={`asset-${asset.id}`}
                      onPress={() => {
                        setTxModal(s => ({
                          ...s,
                          form: {
                            ...s.form,
                            asset_id: isSelected ? null : asset.id,
                            payment_method_id: null,
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
                          backgroundColor: assetColor + '80',
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: isSelected ? assetColor : 'transparent',
                        }}
                      >
                        <AssetIcon
                          size={20}
                          color={Colors.brown}
                          strokeWidth={2.5}
                        />
                      </View>
                      <Text
                        className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                        numberOfLines={1}
                      >
                        {asset.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() =>
                    setTxModal(s => ({
                      ...s,
                      view: 'pmForm',
                      pmEditingId: null,
                      pmForm: INITIAL_PM_FORM,
                    }))
                  }
                  className='items-center gap-1'
                  activeOpacity={0.7}
                >
                  <View className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100 border border-dashed border-neutral-300'>
                    <Plus size={18} color='#A3A3A3' strokeWidth={2} />
                  </View>
                  <Text className='font-ibm-semibold text-[10px] text-neutral-600'>
                    추가
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        <View className='mb-6'>
          <Text className='font-ibm-semibold text-xs text-neutral-600 mb-2 ml-1'>
            {'누가'}
          </Text>
          <View className='flex-row gap-2'>
            {tagOptions.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                onPress={() =>
                  setTxModal(s => ({
                    ...s,
                    form: { ...s.form, tag: value },
                  }))
                }
                className={`flex-1 py-2.5 rounded-2xl items-center ${txModal.form.tag === value ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-ibm-semibold text-sm ${txModal.form.tag === value ? 'text-neutral-800' : 'text-neutral-500'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SaveButton
          onPress={handleTxSave}
          isSaving={isTxSaving}
          label={txModal.editingId ? '수정 완료' : '저장'}
        />
      </BottomSheet>

      {/* ── 카테고리 관리 모달 (풀스크린) ── */}
      <Modal
        visible={txModal.visible && txModal.view === 'catMgmt'}
        animationType='none'
        onRequestClose={() => setTxModal(s => ({ ...s, view: 'tx' }))}
      >
        <SafeAreaView className='flex-1 bg-white'>
          <View className='flex-row items-center justify-between px-6 pt-5 mb-5'>
            <TouchableOpacity
              onPress={() => setTxModal(s => ({ ...s, view: 'tx' }))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className='font-ibm-bold text-lg text-neutral-800'>
              카테고리 관리
            </Text>
            <TouchableOpacity
              onPress={openCatCreate}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Plus size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          >
            {categories.filter(c => c.type === txModal.form.type).length ===
            0 ? (
              <View className='py-16 items-center gap-2'>
                <Text className='font-ibm-semibold text-sm text-neutral-400'>
                  카테고리가 없어요
                </Text>
              </View>
            ) : (
              <View className='gap-2'>
                {categories
                  .filter(c => c.type === txModal.form.type)
                  .map(c => {
                    const Icon = ICON_MAP[c.icon] ?? Wallet;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => openCatEdit(c)}
                        activeOpacity={0.8}
                      >
                        <View className='flex-row items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3'>
                          <View
                            className='w-10 h-10 rounded-xl items-center justify-center'
                            style={{ backgroundColor: c.color + '55' }}
                          >
                            <Icon size={18} color={c.color} strokeWidth={2.5} />
                          </View>
                          <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                            {c.name}
                          </Text>
                          <Text className='font-ibm-regular text-xs text-neutral-400'>
                            {c.budget_amount.toLocaleString('ko-KR')}원
                          </Text>
                          <ChevronRight
                            size={16}
                            color='#D4D4D4'
                            strokeWidth={2}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── 카테고리 추가/수정 모달 (풀스크린, 공통 컴포넌트) ── */}
      <Modal
        visible={txModal.visible && txModal.view === 'catForm'}
        animationType='none'
        onRequestClose={() =>
          setTxModal(s => ({ ...s, view: s.catFormSource }))
        }
      >
        <CategoryFormScreen
          editingId={txModal.catEditingId}
          form={txModal.catForm}
          isSaving={isCatSaving}
          onBack={() => setTxModal(s => ({ ...s, view: s.catFormSource }))}
          onChange={catForm => setTxModal(s => ({ ...s, catForm }))}
          onSave={handleCatSave}
          onDelete={
            txModal.catEditingId
              ? () => handleCatDelete(txModal.catEditingId!)
              : undefined
          }
        />
      </Modal>

      {/* ── 결제수단 관리 모달 (풀스크린) ── */}
      <Modal
        visible={txModal.visible && txModal.view === 'pmMgmt'}
        animationType='none'
        onRequestClose={() => setTxModal(s => ({ ...s, view: 'tx' }))}
      >
        <SafeAreaView className='flex-1 bg-white'>
          <View className='flex-row items-center justify-between px-6 pt-5 mb-5'>
            <TouchableOpacity
              onPress={() => setTxModal(s => ({ ...s, view: 'tx' }))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className='font-ibm-bold text-lg text-neutral-800'>
              결제수단 관리
            </Text>
            <TouchableOpacity
              onPress={() =>
                setTxModal(s => ({
                  ...s,
                  view: 'pmForm',
                  pmEditingId: null,
                  pmForm: INITIAL_PM_FORM,
                }))
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Plus size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          >
            {paymentMethods.length === 0 ? (
              <View className='py-16 items-center gap-2'>
                <Text className='font-ibm-semibold text-sm text-neutral-400'>
                  결제수단이 없어요
                </Text>
              </View>
            ) : (
              <View className='gap-2'>
                {paymentMethods.map(pm => {
                  const pmType = PM_TYPE_OPTIONS.find(t => t.key === pm.type);
                  const Icon = pmType?.Icon ?? Wallet;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() =>
                        setTxModal(s => ({
                          ...s,
                          view: 'pmForm',
                          pmEditingId: pm.id,
                          pmForm: { name: pm.name, type: pm.type },
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <View className='flex-row items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3'>
                        <View
                          className='w-10 h-10 rounded-xl items-center justify-center'
                          style={{ backgroundColor: pm.color + '55' }}
                        >
                          <Icon size={18} color={pm.color} strokeWidth={2.5} />
                        </View>
                        <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                          {pm.name}
                        </Text>
                        <Text className='font-ibm-regular text-xs text-neutral-400'>
                          {pmType?.label ?? ''}
                        </Text>
                        <ChevronRight
                          size={16}
                          color='#D4D4D4'
                          strokeWidth={2}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── 결제수단 추가/수정 모달 (풀스크린, 공통 컴포넌트) ── */}
      <Modal
        visible={txModal.visible && txModal.view === 'pmForm'}
        animationType='none'
        onRequestClose={() =>
          setTxModal(s => ({
            ...s,
            view: s.pmEditingId ? 'pmMgmt' : 'tx',
          }))
        }
      >
        <PaymentMethodFormScreen
          editingId={txModal.pmEditingId}
          form={txModal.pmForm}
          isSaving={
            createPaymentMethod.isPending || updatePaymentMethod.isPending
          }
          onBack={() =>
            setTxModal(s => ({
              ...s,
              view: s.pmEditingId ? 'pmMgmt' : 'tx',
            }))
          }
          onChange={pmForm => setTxModal(s => ({ ...s, pmForm }))}
          onSave={handlePmSave}
          onDelete={
            txModal.pmEditingId
              ? () => handlePmDelete(txModal.pmEditingId!)
              : undefined
          }
        />
      </Modal>

      {/* ── 일정 추가/수정 모달 ── */}
      <BottomSheet
        visible={scheduleModal.visible}
        onClose={() => setScheduleModal(s => ({ ...s, visible: false }))}
      >
        <BottomSheetHeader
          title={scheduleModal.editingId ? '일정 수정' : '일정 추가'}
          onClose={() => setScheduleModal(s => ({ ...s, visible: false }))}
          onDelete={
            scheduleModal.editingId
              ? () => handleScheduleDelete(scheduleModal.editingId!)
              : undefined
          }
          className='mb-5'
        />

        <ModalTextInput
          value={scheduleModal.form.title}
          onChangeText={v =>
            setScheduleModal(s => ({ ...s, form: { ...s.form, title: v } }))
          }
          placeholder='일정 제목'
          maxLength={30}
          autoFocus
          className='mb-5'
        />

        <View className='mb-5'>
          <Text className='font-ibm-semibold text-xs text-neutral-600 mb-2 ml-1'>
            참여자
          </Text>
          <View className='flex-row gap-2'>
            {tagOptions.map(({ value, label }) => {
              const isSelected = scheduleModal.form.tag === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() =>
                    setScheduleModal(s => ({
                      ...s,
                      form: { ...s.form, tag: value },
                    }))
                  }
                  className={`flex-1 py-2.5 rounded-2xl items-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-ibm-semibold text-sm ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 시간 선택 */}
        <View className='mb-6'>
          {scheduleModal.form.time === null ? (
            <TouchableOpacity
              onPress={() =>
                setScheduleModal(s => ({
                  ...s,
                  form: { ...s.form, time: '09:00' },
                }))
              }
              className='bg-neutral-100 rounded-2xl py-3 flex-row items-center justify-center gap-2'
              activeOpacity={0.7}
            >
              <Clock size={14} color='#a3a3a3' strokeWidth={2} />
              <Text className='font-ibm-regular text-sm text-neutral-400'>
                시작 시간 없음
              </Text>
            </TouchableOpacity>
          ) : (
            <View className='bg-neutral-100 rounded-2xl py-3 px-5 flex-row items-center'>
              <Clock size={16} color={Colors.brown} strokeWidth={2} />
              <View className='flex-1 flex-row items-center justify-center gap-3'>
                {/* 시 */}
                <View className='items-center gap-1'>
                  <TouchableOpacity
                    onPress={() => adjustScheduleHour(1)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 4, left: 16, right: 16 }}
                  >
                    <ChevronUp
                      size={16}
                      color={Colors.brown}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                  <TextInput
                    value={scheduleModal.form.time.slice(0, 2)}
                    onChangeText={v => {
                      const digits = v.replace(/[^0-9]/g, '');
                      const n = Math.min(
                        parseInt(digits.slice(-2) || '0', 10),
                        23,
                      );
                      setScheduleModal(s => ({
                        ...s,
                        form: {
                          ...s.form,
                          time: `${String(n).padStart(2, '0')}:${s.form.time?.slice(3, 5) ?? '00'}`,
                        },
                      }));
                    }}
                    keyboardType='number-pad'
                    selectTextOnFocus
                    className='font-ibm-bold text-xl text-neutral-800 w-10 text-center'
                  />
                  <TouchableOpacity
                    onPress={() => adjustScheduleHour(-1)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 8, left: 16, right: 16 }}
                  >
                    <ChevronDown
                      size={16}
                      color={Colors.brown}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                </View>
                <Text className='font-ibm-bold text-xl text-neutral-600'>
                  :
                </Text>
                {/* 분 */}
                <View className='items-center gap-1'>
                  <TouchableOpacity
                    onPress={() => adjustScheduleMinute(5)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 4, left: 16, right: 16 }}
                  >
                    <ChevronUp
                      size={16}
                      color={Colors.brown}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                  <TextInput
                    value={scheduleModal.form.time.slice(3, 5)}
                    onChangeText={v => {
                      const digits = v.replace(/[^0-9]/g, '');
                      const n = Math.min(
                        parseInt(digits.slice(-2) || '0', 10),
                        59,
                      );
                      setScheduleModal(s => ({
                        ...s,
                        form: {
                          ...s.form,
                          time: `${s.form.time?.slice(0, 2) ?? '09'}:${String(n).padStart(2, '0')}`,
                        },
                      }));
                    }}
                    keyboardType='number-pad'
                    selectTextOnFocus
                    className='font-ibm-bold text-xl text-neutral-800 w-10 text-center'
                  />
                  <TouchableOpacity
                    onPress={() => adjustScheduleMinute(-5)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 8, left: 16, right: 16 }}
                  >
                    <ChevronDown
                      size={16}
                      color={Colors.brown}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setScheduleModal(s => ({
                    ...s,
                    form: { ...s.form, time: null },
                  }))
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <X size={18} color='#a3a3a3' strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <SaveButton
          onPress={handleScheduleSave}
          isSaving={isScheduleSaving}
          label={scheduleModal.editingId ? '수정 완료' : '저장'}
        />
      </BottomSheet>

      {/* ── 년월 선택 모달 ── */}
      <BottomSheet
        visible={yearMonthModal}
        onClose={() => setYearMonthModal(false)}
      >
        {/* 오늘 버튼(좌) + 연도 토글(중앙) + 닫기(우) */}
        <View className='flex-row items-center justify-between mb-5'>
          {/* 오늘 버튼 */}
          <TouchableOpacity
            onPress={() => {
              setPickerYear(todayDate.getFullYear());
              setCurrentYear(todayDate.getFullYear());
              setCurrentMonth(todayDate.getMonth());
              setYearMonthModal(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className='px-3 py-1.5 rounded-xl bg-neutral-100'
            style={{ minWidth: 52 }}
            activeOpacity={0.7}
          >
            <Text className='font-ibm-semibold text-xs text-brown/70 text-center'>
              오늘
            </Text>
          </TouchableOpacity>

          {/* 연도 토글 */}
          <View className='flex-row items-center gap-3'>
            <TouchableOpacity
              onPress={() => setPickerYear(y => y - 1)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft
                size={22}
                color={Colors.brownDarker}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
            <Text className='font-ibm-bold text-xl text-brown-darker w-20 text-center'>
              {pickerYear}년
            </Text>
            <TouchableOpacity
              onPress={() => setPickerYear(y => y + 1)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronRight
                size={22}
                color={Colors.brownDarker}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          </View>

          {/* 닫기 */}
          <TouchableOpacity
            onPress={() => setYearMonthModal(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ minWidth: 52, alignItems: 'flex-end' }}
          >
            <X size={22} color='#A3A3A3' strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 월 선택 그리드 */}
        <View className='flex-row flex-wrap gap-2'>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
            const isSelected =
              pickerYear === currentYear && month === currentMonth + 1;
            return (
              <TouchableOpacity
                key={month}
                onPress={() => {
                  setCurrentYear(pickerYear);
                  setCurrentMonth(month - 1);
                  setYearMonthModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`rounded-2xl py-3 items-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                style={{ width: '23%' }}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-ibm-semibold text-sm ${isSelected ? 'text-brown' : 'text-brown/50'}`}
                >
                  {month}월
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* ── 고정지출 수정 모달 ── */}
      <BottomSheet
        visible={fixedModal.visible}
        onClose={() => setFixedModal(s => ({ ...s, visible: false }))}
      >
        <BottomSheetHeader
          title={fixedModal.editingId ? '고정지출 수정' : '고정지출 추가'}
          onClose={() => setFixedModal(s => ({ ...s, visible: false }))}
          className='mb-6'
        />

        <ModalTextInput
          value={fixedModal.form.name}
          onChangeText={v =>
            setFixedModal(s => ({ ...s, form: { ...s.form, name: v } }))
          }
          placeholder='항목 이름 (예: 월세, 넷플릭스)'
          maxLength={20}
          autoFocus
          className='mb-4'
        />

        <AmountInput
          value={fixedModal.form.amount}
          onChangeText={v =>
            setFixedModal(s => ({ ...s, form: { ...s.form, amount: v } }))
          }
          className='mb-4'
        />

        <View className='mb-6'>
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            납부일
          </Text>
          <View className='flex-row flex-wrap gap-1.5'>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
              const isSelected = fixedModal.form.due_day === day;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() =>
                    setFixedModal(s => ({
                      ...s,
                      form: { ...s.form, due_day: day },
                    }))
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
          onPress={handleFixedSave}
          isSaving={
            createFixedExpense.isPending || updateFixedExpense.isPending
          }
          label={fixedModal.editingId ? '수정 완료' : '저장'}
        />
      </BottomSheet>

      {/* ── 거래 상세 + 댓글 모달 ── */}
      <Modal
        visible={!!detailTx}
        animationType='slide'
        transparent
        onRequestClose={() => setDetailTx(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='flex-1 justify-end'
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() => setDetailTx(null)}
          />
          <View
            className='bg-white rounded-t-3xl'
            style={{
              maxHeight: SCREEN_HEIGHT * 0.45,
              paddingBottom: Math.max(insets.bottom, 24),
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -4 },
            }}
          >
            {/* 드래그 핸들 */}
            <View
              className='items-center pt-3 pb-1'
              {...detailPanResponder.panHandlers}
            >
              <View className='w-10 h-1 rounded-full bg-brown/20' />
            </View>

            {/* 헤더 */}
            <View
              className='px-6 pt-3 pb-4'
              {...detailPanResponder.panHandlers}
            >
              <View className='flex-row items-start justify-between'>
                <View className='flex-1'>
                  {detailTx && (
                    <TagPill
                      tag={detailTx.tag}
                      label={resolveTagLabel(detailTx.tag, detailTx.user_id)}
                      className='self-start px-2.5 py-1 mb-2'
                    />
                  )}
                  <Text className='font-ibm-bold text-base text-brown'>
                    {detailTx?.memo ?? detailTx?.categories?.name ?? '내역'}
                  </Text>
                  <Text
                    className={`font-ibm-bold text-lg mt-0.5 ${detailTx?.type === 'expense' ? 'text-peach-dark' : 'text-olive-dark'}`}
                  >
                    {detailTx?.type === 'expense' ? '-' : '+'}
                    {formatAmount(detailTx?.amount ?? 0)}원
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (detailTx) {
                      setDetailTx(null);
                      openTxEdit(detailTx);
                    }
                  }}
                >
                  <Text className='font-ibm-semibold text-xs text-neutral-600'>
                    수정
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={commentScrollRef}
              className='px-6'
              style={{ flexGrow: 0, maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
            >
              {commentsLoading ? (
                <View className='py-4 items-center'>
                  <ActivityIndicator color={Colors.butter} />
                </View>
              ) : (
                <View className='gap-2 py-3'>
                  {comments.map(c => {
                    const isMine = c.user_id === myId;
                    return (
                      <View
                        key={c.id}
                        className={`flex-row ${isMine ? 'flex-row-reverse' : ''}`}
                      >
                        <View
                          className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <View
                            className={`rounded-2xl px-3 py-2 ${isMine ? 'bg-butter' : 'bg-white'}`}
                            style={{
                              shadowColor: Colors.brown,
                              shadowOpacity: 0.05,
                              shadowRadius: 6,
                              shadowOffset: { width: 0, height: 1 },
                            }}
                          >
                            <Text className='font-ibm-regular text-sm text-brown'>
                              {c.content}
                            </Text>
                          </View>
                          <View className='flex-row items-center gap-2 mt-1'>
                            <Text className='font-ibm-regular text-[10px] text-brown/30'>
                              {formatTime(c.created_at)}
                            </Text>
                            {isMine && (
                              <TouchableOpacity
                                onPress={() => handleCommentDelete(c.id)}
                                hitSlop={{
                                  top: 6,
                                  bottom: 6,
                                  left: 6,
                                  right: 6,
                                }}
                              >
                                <Trash2
                                  size={12}
                                  color={Colors.brown + '40'}
                                  strokeWidth={2}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View className='flex-row items-center gap-3 px-6 pt-4'>
              <View className='flex-1 bg-neutral-100 rounded-2xl px-4 py-3'>
                <TextInput
                  className='font-ibm-regular text-sm text-brown'
                  placeholder='댓글을 입력하세요'
                  placeholderTextColor={Colors.brown + '40'}
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={200}
                  returnKeyType='send'
                  onSubmitEditing={handleCommentSend}
                />
              </View>
              <TouchableOpacity
                onPress={handleCommentSend}
                disabled={!commentText.trim() || createComment.isPending}
                className='w-10 h-10 rounded-full bg-butter items-center justify-center'
                activeOpacity={0.7}
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                {createComment.isPending ? (
                  <ActivityIndicator size='small' color={Colors.brown} />
                ) : (
                  <Send size={16} color={Colors.brown} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
