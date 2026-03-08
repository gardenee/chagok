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
import { useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CalendarX,
  Plus,
  Trash2,
  X,
  Check,
  MessageCircle,
  Send,
  CalendarDays,
  Repeat,
  Wallet,
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
  type CommentRow,
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
import { EmptyState } from '../../components/ui/empty-state';
import type { Schedule, FixedExpense } from '../../types/database';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type TxFormData = {
  amount: string;
  type: 'expense' | 'income';
  tag: 'me' | 'partner' | 'together';
  memo: string;
  category_id: string | null;
};

type ScheduleFormData = {
  title: string;
  tag: 'me' | 'partner' | 'together';
};

const INITIAL_TX_FORM: TxFormData = {
  amount: '',
  type: 'expense',
  tag: 'me',
  memo: '',
  category_id: null,
};
const INITIAL_SCHEDULE_FORM: ScheduleFormData = { title: '', tag: 'me' };

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTagClassName(tag: 'me' | 'partner' | 'together'): string {
  return { me: 'bg-butter', partner: 'bg-peach', together: 'bg-lavender' }[tag];
}

function getTagBgColor(tag: 'me' | 'partner' | 'together'): string {
  return { me: '#FAD97A', partner: '#F7B8A0', together: '#D4C5F0' }[tag];
}

function formatAmountShort(n: number): string {
  if (n >= 10000) {
    const man = n / 10000;
    return `${man % 1 === 0 ? Math.floor(man) : man.toFixed(1)}만`;
  }
  if (n >= 1000) return `${Math.floor(n / 1000)}천`;
  return String(n);
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
  const todayDate = new Date();
  const todayStr = formatDate(todayDate);
  const { session, userProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const myId = session?.user.id ?? '';

  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [txModal, setTxModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: TxFormData;
    view: 'tx' | 'catMgmt' | 'catForm';
    catEditingId: string | null;
    catForm: CategoryFormData;
    catFormSource: 'tx' | 'catMgmt';
  }>({
    visible: false,
    editingId: null,
    form: INITIAL_TX_FORM,
    view: 'tx',
    catEditingId: null,
    catForm: INITIAL_CATEGORY_FORM,
    catFormSource: 'tx',
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
    const amount = parseInt(
      txModal.catForm.budget_amount.replace(/[^0-9]/g, ''),
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

  // 가계부 탭용: 날짜별 지출/수입 합계
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
  const selectedSchedules = schedulesByDate[selectedDate] ?? [];
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
      form: { title: s.title, tag: s.tag },
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
      const newComment = await createComment.mutateAsync({
        transactionId: txId,
        content: text,
      });
      queryClient.setQueryData(
        ['comments', txId],
        (old: CommentRow[] | undefined) => [...(old ?? []), newComment],
      );
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
                  className={`font-ibm-semibold text-xs ${i === 0 ? 'text-peach' : i === 6 ? 'text-lavender-dark' : 'text-brown/70'}`}
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
              const hasFixed =
                item.isCurrentMonth &&
                fixedExpenses.some(fe => fe.due_day === item.day);
              // 일정 탭용
              const daySchedules = schedulesByDate[item.date] ?? [];
              const visibleSchedules = daySchedules.slice(0, 3);
              const extraCount = daySchedules.length - 3;
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
                  className='w-[14.28%] items-center py-1'
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? 'bg-butter' : item.isToday ? 'bg-butter/50' : ''}`}
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
                        !item.isCurrentMonth
                          ? 'text-neutral-300'
                          : col === 0
                            ? isSelected
                              ? 'text-brown'
                              : 'text-peach'
                            : col === 6
                              ? isSelected
                                ? 'text-brown'
                                : 'text-lavender-dark'
                              : isSelected
                                ? 'text-brown'
                                : 'text-neutral-800'
                      }`}
                    >
                      {item.day}
                    </Text>
                  </View>
                  {/* 가계부 탭: 날짜별 지출/수입 금액 */}
                  {activeTab === 'ledger' && (
                    <View
                      className='w-full items-center'
                      style={{ minHeight: 26 }}
                    >
                      {item.isCurrentMonth && dayExpense > 0 && (
                        <Text
                          className='font-ibm-semibold text-peach text-center'
                          style={{ fontSize: 8, lineHeight: 12 }}
                          numberOfLines={1}
                        >
                          -{formatAmountShort(dayExpense)}
                        </Text>
                      )}
                      {item.isCurrentMonth && dayIncome > 0 && (
                        <Text
                          className='font-ibm-semibold text-lavender-dark text-center'
                          style={{ fontSize: 8, lineHeight: 12 }}
                          numberOfLines={1}
                        >
                          +{formatAmountShort(dayIncome)}
                        </Text>
                      )}
                      {hasFixed && dayExpense === 0 && dayIncome === 0 && (
                        <View
                          className='w-1 h-1 rounded-full bg-butter mt-1'
                          style={{
                            borderWidth: 0.5,
                            borderColor: Colors.brown + '40',
                          }}
                        />
                      )}
                    </View>
                  )}
                  {/* 일정 탭: 일정 제목 미리보기 */}
                  {activeTab === 'schedule' && (
                    <View
                      className='w-full px-0.5 mt-0.5'
                      style={{ minHeight: 28 }}
                    >
                      {item.isCurrentMonth &&
                        visibleSchedules.map(s => (
                          <View
                            key={s.id}
                            className='rounded-sm mb-px overflow-hidden'
                            style={{
                              backgroundColor: getTagBgColor(s.tag) + 'BB',
                            }}
                          >
                            <Text
                              className='font-ibm-semibold text-brown'
                              style={{
                                fontSize: 7,
                                lineHeight: 11,
                                paddingHorizontal: 2,
                              }}
                              numberOfLines={1}
                            >
                              {s.title}
                            </Text>
                          </View>
                        ))}
                      {item.isCurrentMonth && extraCount > 0 && (
                        <Text
                          className='font-ibm-regular text-neutral-400 text-center'
                          style={{ fontSize: 7, lineHeight: 10 }}
                        >
                          +{extraCount}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === 'ledger' ? (
            <View className='flex-row gap-4 justify-end mt-2 pt-2 border-t border-cream-dark'>
              <View className='flex-row items-center gap-1'>
                <View className='w-2 h-2 rounded-full bg-peach' />
                <Text className='font-ibm-regular text-[10px] text-neutral-400'>
                  지출
                </Text>
              </View>
              <View className='flex-row items-center gap-1'>
                <View className='w-2 h-2 rounded-full bg-lavender-dark' />
                <Text className='font-ibm-regular text-[10px] text-neutral-400'>
                  수입
                </Text>
              </View>
              <View className='flex-row items-center gap-1'>
                <View
                  className='w-2 h-2 rounded-full bg-butter'
                  style={{ borderWidth: 0.5, borderColor: Colors.brown + '40' }}
                />
                <Text className='font-ibm-regular text-[10px] text-neutral-400'>
                  고정
                </Text>
              </View>
            </View>
          ) : (
            <View className='flex-row gap-4 justify-end mt-2 pt-2 border-t border-cream-dark'>
              <View className='flex-row items-center gap-1'>
                <View className='w-2 h-2 rounded-full bg-butter' />
                <Text className='font-ibm-regular text-[10px] text-neutral-400'>
                  나
                </Text>
              </View>
              <View className='flex-row items-center gap-1'>
                <View className='w-2 h-2 rounded-full bg-peach' />
                <Text className='font-ibm-regular text-[10px] text-neutral-400'>
                  파트너
                </Text>
              </View>
              <View className='flex-row items-center gap-1'>
                <View className='w-2 h-2 rounded-full bg-lavender' />
                <Text className='font-ibm-regular text-[10px] text-neutral-400'>
                  함께
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 선택일 요약 (가계부 탭만) */}
        {activeTab === 'ledger' && (
          <View className='mx-4 mt-4 flex-row gap-3'>
            <View className='flex-1 bg-butter/50 rounded-2xl px-4 py-3.5'>
              <Text className='font-ibm-regular text-xs text-brown/80'>
                지출
              </Text>
              <Text className='font-ibm-bold text-[15px] text-brown mt-1'>
                {totalExpense > 0 ? `-${formatAmount(totalExpense)}원` : '-'}
              </Text>
            </View>
            <View className='flex-1 bg-lavender/60 rounded-2xl px-4 py-3.5'>
              <Text className='font-ibm-regular text-xs text-brown/80'>
                수입
              </Text>
              <Text className='font-ibm-bold text-[15px] text-brown mt-1'>
                {totalIncome > 0 ? `+${formatAmount(totalIncome)}원` : '-'}
              </Text>
            </View>
          </View>
        )}

        {/* 탭 전환 */}
        <View className='mx-4 mt-5 flex-row bg-neutral-100 rounded-2xl p-1'>
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
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'schedule' ? 'bg-lavender' : ''}`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-ibm-semibold text-sm ${activeTab === 'schedule' ? 'text-brown' : 'text-brown/40'}`}
            >
              일정
            </Text>
          </TouchableOpacity>
        </View>

        {/* 탭 콘텐츠 */}
        <View className='mx-4 mt-4'>
          {/* 헤더 */}
          <View className='flex-row items-center justify-between mb-3'>
            <Text className='font-ibm-bold text-base text-neutral-700'>
              {getSelectedDateLabel(selectedDate)}{' '}
              {activeTab === 'ledger' ? '거래' : '일정'}
            </Text>
            {activeTab === 'ledger' ? (
              <View className='flex-row gap-2'>
                <TouchableOpacity
                  onPress={openFixedCreate}
                  className='w-8 h-8 rounded-full items-center justify-center'
                  activeOpacity={0.6}
                >
                  <Repeat size={16} color={Colors.brown} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openTxCreate}
                  className='w-8 h-8 rounded-full items-center justify-center'
                  activeOpacity={0.6}
                >
                  <Plus size={16} color={Colors.brown} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={openScheduleCreate}
                className='w-8 h-8 rounded-full bg-lavender items-center justify-center'
                activeOpacity={0.7}
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                <Plus size={16} color={Colors.brown} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* 가계부 탭 */}
          {activeTab === 'ledger' &&
            (txLoading ? (
              <View className='py-8 items-center'>
                <ActivityIndicator color={Colors.butter} />
              </View>
            ) : selectedTransactions.length === 0 &&
              selectedFixedExpenses.length === 0 ? (
              <EmptyState icon={CalendarX} title='거래 내역이 없어요' />
            ) : (
              <View className='gap-2.5'>
                {selectedTransactions.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      setDetailTx(t);
                      setCommentText('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      className='bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3'
                      style={{
                        shadowColor: Colors.brown,
                        shadowOpacity: 0.07,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                      }}
                    >
                      <View
                        className={`w-10 h-10 rounded-2xl items-center justify-center ${t.type === 'expense' ? 'bg-peach/40' : 'bg-lavender/50'}`}
                      >
                        {t.type === 'expense' ? (
                          <TrendingDown
                            size={18}
                            color={Colors.peach}
                            strokeWidth={2.5}
                          />
                        ) : (
                          <TrendingUp
                            size={18}
                            color={Colors.lavender}
                            strokeWidth={2.5}
                          />
                        )}
                      </View>
                      <View className='flex-1'>
                        <View className='flex-row items-center gap-1.5'>
                          <View
                            className={`px-2 py-0.5 rounded-full ${getTagClassName(t.tag)}`}
                          >
                            <Text className='font-ibm-semibold text-[10px] text-brown'>
                              {resolveTagLabel(t.tag, t.user_id)}
                            </Text>
                          </View>
                          {t.categories?.name && (
                            <Text className='font-ibm-regular text-xs text-neutral-500'>
                              {t.categories.name}
                            </Text>
                          )}
                        </View>
                        <Text className='font-ibm-semibold text-sm text-neutral-800 mt-1'>
                          {t.memo ?? t.categories?.name ?? '내역'}
                        </Text>
                      </View>
                      <View className='items-end gap-1.5'>
                        <Text
                          className={`font-ibm-bold text-sm ${t.type === 'expense' ? 'text-neutral-800' : 'text-lavender-dark'}`}
                        >
                          {t.type === 'expense' ? '-' : '+'}
                          {formatAmount(t.amount)}원
                        </Text>
                        <View className='flex-row items-center gap-2'>
                          <MessageCircle
                            size={13}
                            color={Colors.brown + '50'}
                            strokeWidth={2}
                          />
                          <TouchableOpacity
                            onPress={() => handleTxDelete(t.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2
                              size={13}
                              color={Colors.brown + '50'}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {selectedFixedExpenses.map(fe => (
                  <TouchableOpacity
                    key={fe.id}
                    onPress={() => openFixedEdit(fe)}
                    activeOpacity={0.8}
                  >
                    <View
                      className='bg-butter/20 rounded-3xl px-4 py-4 flex-row items-center gap-3'
                      style={{
                        shadowColor: Colors.butter,
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                      }}
                    >
                      <View className='w-10 h-10 rounded-2xl items-center justify-center bg-butter/60'>
                        <Repeat
                          size={18}
                          color={Colors.brown}
                          strokeWidth={2.5}
                        />
                      </View>
                      <View className='flex-1'>
                        <View className='flex-row items-center gap-1.5'>
                          <View className='px-2 py-0.5 rounded-full bg-butter'>
                            <Text className='font-ibm-semibold text-[10px] text-brown'>
                              고정지출
                            </Text>
                          </View>
                          <Text className='font-ibm-regular text-xs text-brown/70'>
                            매월 {fe.due_day}일
                          </Text>
                        </View>
                        <Text className='font-ibm-semibold text-sm text-brown mt-1'>
                          {fe.name}
                        </Text>
                      </View>
                      <View className='items-end gap-1.5'>
                        <Text className='font-ibm-bold text-sm text-brown'>
                          -{formatAmount(fe.amount)}원
                        </Text>
                        <Text className='font-ibm-regular text-[10px] text-brown/60'>
                          탭하여 수정
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

          {/* 일정 탭 */}
          {activeTab === 'schedule' &&
            (scheduleLoading ? (
              <View className='py-8 items-center'>
                <ActivityIndicator color={Colors.lavender} />
              </View>
            ) : selectedSchedules.length === 0 ? (
              <EmptyState icon={CalendarDays} title='등록된 일정이 없어요' />
            ) : (
              <View className='gap-2.5'>
                {selectedSchedules.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => openScheduleEdit(s)}
                    activeOpacity={0.8}
                  >
                    <View
                      className='bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3'
                      style={{
                        shadowColor: Colors.brown,
                        shadowOpacity: 0.07,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                      }}
                    >
                      <View className='w-10 h-10 rounded-2xl items-center justify-center bg-lavender/50'>
                        <CalendarDays
                          size={18}
                          color={Colors.brown}
                          strokeWidth={2}
                        />
                      </View>
                      <View className='flex-1'>
                        <View
                          className={`self-start px-2 py-0.5 rounded-full ${getTagClassName(s.tag)}`}
                        >
                          <Text className='font-ibm-semibold text-[10px] text-brown'>
                            {resolveTagLabel(s.tag, s.user_id)}
                          </Text>
                        </View>
                        <Text className='font-ibm-semibold text-sm text-neutral-800 mt-1'>
                          {s.title}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleScheduleDelete(s.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2
                          size={13}
                          color={Colors.brown + '50'}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
        </View>
      </ScrollView>

      {/* ── 거래 추가/수정 모달 (half-sheet) ── */}
      <Modal
        visible={txModal.visible && txModal.view === 'tx'}
        animationType='slide'
        transparent
        onRequestClose={() =>
          setTxModal(s => ({ ...s, visible: false, view: 'tx' }))
        }
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='flex-1 justify-end'
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() =>
              setTxModal(s => ({ ...s, visible: false, view: 'tx' }))
            }
          />
          <View
            className='bg-white rounded-t-3xl px-6 pt-5 pb-10'
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -4 },
            }}
          >
            <View className='flex-row items-center justify-between mb-6'>
              <Text className='font-ibm-bold text-lg text-neutral-800'>
                {txModal.editingId
                  ? '내역 수정'
                  : `${getSelectedDateLabel(selectedDate)} 내역 추가`}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setTxModal(s => ({ ...s, visible: false, view: 'tx' }))
                }
              >
                <X size={22} color='#737373' strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View className='flex-row bg-neutral-100 rounded-2xl p-1 mb-5'>
              {(['expense', 'income'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() =>
                    setTxModal(s => ({ ...s, form: { ...s.form, type } }))
                  }
                  className={`flex-1 py-2.5 rounded-xl items-center ${txModal.form.type === type ? (type === 'expense' ? 'bg-peach' : 'bg-lavender') : ''}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-ibm-semibold text-sm ${txModal.form.type === type ? 'text-brown' : 'text-brown/40'}`}
                  >
                    {type === 'expense' ? '지출' : '수입'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4 flex-row items-center'>
              <Text className='font-ibm-semibold text-neutral-500 text-base mr-2'>
                ₩
              </Text>
              <TextInput
                className='flex-1 font-ibm-semibold text-base text-neutral-800'
                placeholder='금액 입력'
                placeholderTextColor='#A3A3A3'
                keyboardType='numeric'
                value={txModal.form.amount}
                onChangeText={v =>
                  setTxModal(s => ({
                    ...s,
                    form: { ...s.form, amount: v.replace(/[^0-9]/g, '') },
                  }))
                }
              />
            </View>

            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4'>
              <TextInput
                className='font-ibm-regular text-sm text-neutral-800'
                placeholder='메모 (선택)'
                placeholderTextColor='#A3A3A3'
                value={txModal.form.memo}
                onChangeText={v =>
                  setTxModal(s => ({
                    ...s,
                    form: { ...s.form, memo: v },
                  }))
                }
                maxLength={50}
              />
            </View>

            {/* 카테고리 선택 */}
            <View className='mb-5'>
              <View className='flex-row items-center justify-between mb-2 ml-1 mr-1'>
                <Text className='font-ibm-semibold text-xs text-neutral-500'>
                  카테고리
                </Text>
                {categories.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setTxModal(s => ({ ...s, view: 'catMgmt' }))}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text className='font-ibm-semibold text-xs text-brown/60'>
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
                  <TouchableOpacity
                    onPress={openCatCreate}
                    className='items-center gap-1'
                    activeOpacity={0.7}
                  >
                    <View className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100 border border-dashed border-neutral-300'>
                      <Plus size={18} color='#A3A3A3' strokeWidth={2} />
                    </View>
                    <Text className='font-ibm-semibold text-[10px] text-neutral-400'>
                      추가
                    </Text>
                  </TouchableOpacity>
                  {categories.map(c => {
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
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        }}
                        className='items-center gap-1'
                        activeOpacity={0.7}
                      >
                        <View
                          className='w-12 h-12 rounded-2xl items-center justify-center'
                          style={{
                            backgroundColor: isSelected
                              ? c.color
                              : c.color + '40',
                          }}
                        >
                          <Icon
                            size={20}
                            color={isSelected ? '#fff' : c.color}
                            strokeWidth={2.5}
                          />
                        </View>
                        <Text
                          className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-brown' : 'text-neutral-400'}`}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className='flex-row gap-2 mb-6'>
              {tagOptions.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() =>
                    setTxModal(s => ({
                      ...s,
                      form: { ...s.form, tag: value },
                    }))
                  }
                  className={`flex-1 py-2.5 rounded-2xl items-center ${txModal.form.tag === value ? getTagClassName(value) : 'bg-neutral-100'}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-ibm-semibold text-sm ${txModal.form.tag === value ? 'text-brown' : 'text-brown/40'}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleTxSave}
              disabled={isTxSaving}
              className='bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2'
              activeOpacity={0.8}
              style={{
                shadowColor: Colors.butter,
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              {isTxSaving ? (
                <ActivityIndicator color={Colors.brown} />
              ) : (
                <>
                  <Check size={18} color={Colors.brown} strokeWidth={2.5} />
                  <Text className='font-ibm-bold text-base text-brown'>
                    {txModal.editingId ? '수정 완료' : '저장'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
            {categories.length === 0 ? (
              <View className='py-16 items-center gap-2'>
                <Text className='font-ibm-semibold text-sm text-neutral-400'>
                  카테고리가 없어요
                </Text>
              </View>
            ) : (
              <View className='gap-2'>
                {categories.map(c => {
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

      {/* ── 일정 추가/수정 모달 ── */}
      <Modal
        visible={scheduleModal.visible}
        animationType='slide'
        transparent
        onRequestClose={() => setScheduleModal(s => ({ ...s, visible: false }))}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='flex-1 justify-end'
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() => setScheduleModal(s => ({ ...s, visible: false }))}
          />
          <View
            className='bg-white rounded-t-3xl px-6 pt-5 pb-10'
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -4 },
            }}
          >
            <View className='flex-row items-center justify-between mb-6'>
              <Text className='font-ibm-bold text-lg text-neutral-800'>
                {scheduleModal.editingId
                  ? '일정 수정'
                  : `${getSelectedDateLabel(selectedDate)} 일정 추가`}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setScheduleModal(s => ({ ...s, visible: false }))
                }
              >
                <X size={22} color='#737373' strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-5'>
              <TextInput
                className='font-ibm-regular text-sm text-neutral-800'
                placeholder='일정 제목'
                placeholderTextColor='#A3A3A3'
                value={scheduleModal.form.title}
                onChangeText={v =>
                  setScheduleModal(s => ({
                    ...s,
                    form: { ...s.form, title: v },
                  }))
                }
                maxLength={30}
                autoFocus
              />
            </View>

            <View className='flex-row gap-2 mb-6'>
              {tagOptions.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() =>
                    setScheduleModal(s => ({
                      ...s,
                      form: { ...s.form, tag: value },
                    }))
                  }
                  className={`flex-1 py-2.5 rounded-2xl items-center ${scheduleModal.form.tag === value ? getTagClassName(value) : 'bg-neutral-100'}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-ibm-semibold text-sm ${scheduleModal.form.tag === value ? 'text-brown' : 'text-brown/40'}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleScheduleSave}
              disabled={isScheduleSaving}
              className='bg-lavender rounded-2xl py-4 items-center flex-row justify-center gap-2'
              activeOpacity={0.8}
              style={{
                shadowColor: Colors.lavender,
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              {isScheduleSaving ? (
                <ActivityIndicator color={Colors.brown} />
              ) : (
                <>
                  <Check size={18} color={Colors.brown} strokeWidth={2.5} />
                  <Text className='font-ibm-bold text-base text-brown'>
                    {scheduleModal.editingId ? '수정 완료' : '저장'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 년월 선택 모달 ── */}
      <Modal
        visible={yearMonthModal}
        animationType='slide'
        transparent
        onRequestClose={() => setYearMonthModal(false)}
      >
        <TouchableOpacity
          className='flex-1'
          activeOpacity={1}
          onPress={() => setYearMonthModal(false)}
        />
        <View
          className='bg-white rounded-t-3xl px-6 pt-5 pb-10'
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          <View className='flex-row items-center justify-between mb-6'>
            <Text className='font-ibm-bold text-lg text-neutral-800'>
              날짜 선택
            </Text>
            <View className='flex-row items-center gap-3'>
              <TouchableOpacity
                onPress={() => {
                  setPickerYear(todayDate.getFullYear());
                  setCurrentYear(todayDate.getFullYear());
                  setCurrentMonth(todayDate.getMonth());
                  setSelectedDate(todayStr);
                  setYearMonthModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className='px-3 py-1.5 rounded-xl bg-butter'
                activeOpacity={0.7}
              >
                <Text className='font-ibm-semibold text-xs text-brown'>
                  오늘
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setYearMonthModal(false)}>
                <X size={22} color='#737373' strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 년도 선택 */}
          <View className='flex-row items-center justify-center gap-6 mb-6'>
            <TouchableOpacity
              onPress={() => setPickerYear(y => y - 1)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className='font-ibm-bold text-2xl text-neutral-800 w-24 text-center'>
              {pickerYear}년
            </Text>
            <TouchableOpacity
              onPress={() => setPickerYear(y => y + 1)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronRight size={22} color={Colors.brown} strokeWidth={2.5} />
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
                  className={`rounded-2xl py-3 items-center ${isSelected ? 'bg-butter' : 'bg-neutral-100'}`}
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
        </View>
      </Modal>

      {/* ── 고정지출 수정 모달 ── */}
      <Modal
        visible={fixedModal.visible}
        animationType='slide'
        transparent
        onRequestClose={() => setFixedModal(s => ({ ...s, visible: false }))}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='flex-1 justify-end'
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() => setFixedModal(s => ({ ...s, visible: false }))}
          />
          <View
            className='bg-white rounded-t-3xl px-6 pt-5 pb-10'
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -4 },
            }}
          >
            <View className='flex-row items-center justify-between mb-6'>
              <Text className='font-ibm-bold text-lg text-neutral-800'>
                {fixedModal.editingId ? '고정지출 수정' : '고정지출 추가'}
              </Text>
              <TouchableOpacity
                onPress={() => setFixedModal(s => ({ ...s, visible: false }))}
              >
                <X size={22} color='#737373' strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4'>
              <TextInput
                className='font-ibm-regular text-sm text-brown'
                placeholder='고정지출 이름'
                placeholderTextColor={Colors.brown + '40'}
                value={fixedModal.form.name}
                onChangeText={v =>
                  setFixedModal(s => ({ ...s, form: { ...s.form, name: v } }))
                }
                maxLength={20}
              />
            </View>

            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4 flex-row items-center'>
              <Text className='font-ibm-semibold text-brown text-base mr-2'>
                ₩
              </Text>
              <TextInput
                className='flex-1 font-ibm-semibold text-base text-brown'
                placeholder='금액 입력'
                placeholderTextColor={Colors.brown + '40'}
                keyboardType='numeric'
                value={fixedModal.form.amount}
                onChangeText={v =>
                  setFixedModal(s => ({
                    ...s,
                    form: { ...s.form, amount: v.replace(/[^0-9]/g, '') },
                  }))
                }
              />
            </View>

            <View className='bg-neutral-100 rounded-2xl px-4 py-3 mb-6 flex-row items-center justify-between'>
              <Text className='font-ibm-regular text-sm text-brown/60'>
                매월 결제일
              </Text>
              <View className='flex-row items-center gap-3'>
                <TouchableOpacity
                  onPress={() =>
                    setFixedModal(s => ({
                      ...s,
                      form: {
                        ...s.form,
                        due_day: Math.max(1, s.form.due_day - 1),
                      },
                    }))
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronLeft size={18} color={Colors.brown} strokeWidth={2} />
                </TouchableOpacity>
                <Text className='font-ibm-bold text-base text-brown w-10 text-center'>
                  {fixedModal.form.due_day}일
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setFixedModal(s => ({
                      ...s,
                      form: {
                        ...s.form,
                        due_day: Math.min(31, s.form.due_day + 1),
                      },
                    }))
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronRight
                    size={18}
                    color={Colors.brown}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleFixedSave}
              disabled={
                createFixedExpense.isPending || updateFixedExpense.isPending
              }
              className='bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2'
              activeOpacity={0.8}
              style={{
                shadowColor: Colors.butter,
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              {createFixedExpense.isPending || updateFixedExpense.isPending ? (
                <ActivityIndicator color={Colors.brown} />
              ) : (
                <>
                  <Check size={18} color={Colors.brown} strokeWidth={2.5} />
                  <Text className='font-ibm-bold text-base text-brown'>
                    {fixedModal.editingId ? '수정 완료' : '저장'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
                  <View
                    className={`self-start px-2.5 py-1 rounded-full mb-2 ${getTagClassName(detailTx?.tag ?? 'me')}`}
                  >
                    <Text className='font-ibm-semibold text-[11px] text-brown'>
                      {detailTx
                        ? resolveTagLabel(detailTx.tag, detailTx.user_id)
                        : ''}
                    </Text>
                  </View>
                  <Text className='font-ibm-bold text-base text-brown'>
                    {detailTx?.memo ?? detailTx?.categories?.name ?? '내역'}
                  </Text>
                  <Text
                    className={`font-ibm-bold text-lg mt-0.5 ${detailTx?.type === 'expense' ? 'text-brown' : 'text-lavender-dark'}`}
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
                  <Text className='font-ibm-semibold text-xs text-brown/40'>
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

            <View className='flex-row items-center gap-3 px-6 py-4'>
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
