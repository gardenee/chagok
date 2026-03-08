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
} from 'lucide-react-native';
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
import { useFixedExpenses, useCreateFixedExpense, useUpdateFixedExpense } from '../../hooks/use-fixed-expenses';
import type { Schedule, FixedExpense } from '../../types/database';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type TxFormData = {
  amount: string;
  type: 'expense' | 'income';
  tag: 'me' | 'partner' | 'together';
  memo: string;
};

type ScheduleFormData = {
  title: string;
  tag: 'me' | 'partner' | 'together';
};

const INITIAL_TX_FORM: TxFormData = { amount: '', type: 'expense', tag: 'me', memo: '' };
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

  const [txModal, setTxModal] = useState<{ visible: boolean; editingId: string | null; form: TxFormData }>({
    visible: false, editingId: null, form: INITIAL_TX_FORM,
  });
  const [scheduleModal, setScheduleModal] = useState<{ visible: boolean; editingId: string | null; form: ScheduleFormData }>({
    visible: false, editingId: null, form: INITIAL_SCHEDULE_FORM,
  });
  const [detailTx, setDetailTx] = useState<TransactionRow | null>(null);
  const [commentText, setCommentText] = useState('');
  const [fixedModal, setFixedModal] = useState<{ visible: boolean; editingId: string | null; form: { name: string; amount: string; due_day: number } }>({
    visible: false, editingId: null, form: { name: '', amount: '', due_day: 1 },
  });
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
    })
  ).current;

  const { data: transactions = [], isLoading: txLoading } = useMonthTransactions(currentYear, currentMonth);
  const { data: schedules = [], isLoading: scheduleLoading } = useMonthSchedules(currentYear, currentMonth);
  const { data: fixedExpenses = [] } = useFixedExpenses();
  const { data: comments = [], isLoading: commentsLoading } = useTransactionComments(detailTx?.id ?? '');
  const { data: members = [] } = useCoupleMembers();

  const myNickname = userProfile?.nickname ?? '나';
  const partner = members.find(m => m.id !== myId);
  const partnerNickname = partner?.nickname ?? '파트너';

  // 태그를 실제 닉네임으로 변환 (작성자 기준)
  function resolveTagLabel(tag: 'me' | 'partner' | 'together', creatorId: string): string {
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

  const isTxSaving = createTx.isPending || updateTx.isPending;
  const isScheduleSaving = createSchedule.isPending || updateSchedule.isPending;

  function prevMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11); }
    else setCurrentMonth(m => m - 1);
  }

  function nextMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0); }
    else setCurrentMonth(m => m + 1);
  }

  const calendarDays = useMemo((): DayCell[] => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days: DayCell[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ date: formatDate(new Date(currentYear, currentMonth - 1, prevMonthLastDay - i)), day: prevMonthLastDay - i, isCurrentMonth: false, isToday: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(currentYear, currentMonth, d));
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: formatDate(new Date(currentYear, currentMonth + 1, d)), day: d, isCurrentMonth: false, isToday: false });
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
  const selectedFixedExpenses = fixedExpenses.filter(fe => fe.due_day === selectedDay);
  const totalExpense = selectedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = selectedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  function openTxCreate() {
    setTxModal({ visible: true, editingId: null, form: INITIAL_TX_FORM });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openTxEdit(t: TransactionRow) {
    setTxModal({ visible: true, editingId: t.id, form: { amount: String(t.amount), type: t.type, tag: t.tag, memo: t.memo ?? '' } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleTxSave() {
    const amount = parseInt(txModal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) { Alert.alert('입력 오류', '금액을 올바르게 입력해주세요'); return; }
    const payload = { amount, type: txModal.form.type, tag: txModal.form.tag, memo: txModal.form.memo.trim() || null, date: selectedDate };
    try {
      if (txModal.editingId) await updateTx.mutateAsync({ id: txModal.editingId, ...payload });
      else await createTx.mutateAsync(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTxModal(s => ({ ...s, visible: false }));
    } catch { Alert.alert('오류', '저장 중 문제가 발생했어요'); }
  }
  function handleTxDelete(id: string) {
    Alert.alert('내역 삭제', '이 내역을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try { await deleteTx.mutateAsync(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
        catch { Alert.alert('오류', '삭제 중 문제가 발생했어요'); }
      }},
    ]);
  }

  function openFixedCreate() {
    setFixedModal({ visible: true, editingId: null, form: { name: '', amount: '', due_day: selectedDay } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openFixedEdit(fe: FixedExpense) {
    setFixedModal({ visible: true, editingId: fe.id, form: { name: fe.name, amount: String(fe.amount), due_day: fe.due_day } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleFixedSave() {
    const amount = parseInt(fixedModal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (!fixedModal.form.name.trim()) { Alert.alert('입력 오류', '이름을 입력해주세요'); return; }
    if (!amount || amount <= 0) { Alert.alert('입력 오류', '금액을 올바르게 입력해주세요'); return; }
    try {
      if (fixedModal.editingId) {
        await updateFixedExpense.mutateAsync({ id: fixedModal.editingId, name: fixedModal.form.name.trim(), amount, due_day: fixedModal.form.due_day });
      } else {
        await createFixedExpense.mutateAsync({ name: fixedModal.form.name.trim(), amount, due_day: fixedModal.form.due_day });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFixedModal(s => ({ ...s, visible: false }));
    } catch { Alert.alert('오류', '저장 중 문제가 발생했어요'); }
  }

  function openScheduleCreate() {
    setScheduleModal({ visible: true, editingId: null, form: INITIAL_SCHEDULE_FORM });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openScheduleEdit(s: Schedule) {
    setScheduleModal({ visible: true, editingId: s.id, form: { title: s.title, tag: s.tag } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  async function handleScheduleSave() {
    if (!scheduleModal.form.title.trim()) { Alert.alert('입력 오류', '일정 제목을 입력해주세요'); return; }
    const payload = { title: scheduleModal.form.title.trim(), tag: scheduleModal.form.tag, date: selectedDate };
    try {
      if (scheduleModal.editingId) await updateSchedule.mutateAsync({ id: scheduleModal.editingId, ...payload });
      else await createSchedule.mutateAsync(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScheduleModal(s => ({ ...s, visible: false }));
    } catch { Alert.alert('오류', '저장 중 문제가 발생했어요'); }
  }
  function handleScheduleDelete(id: string) {
    Alert.alert('일정 삭제', '이 일정을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try { await deleteSchedule.mutateAsync(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
        catch { Alert.alert('오류', '삭제 중 문제가 발생했어요'); }
      }},
    ]);
  }

  async function handleCommentSend() {
    if (!commentText.trim() || !detailTx) return;
    const txId = detailTx.id;
    const text = commentText.trim();
    setCommentText('');
    try {
      const newComment = await createComment.mutateAsync({ transactionId: txId, content: text });
      queryClient.setQueryData(
        ['comments', txId],
        (old: CommentRow[] | undefined) => [...(old ?? []), newComment],
      );
      setTimeout(() => commentScrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      setCommentText(text);
      Alert.alert('오류', '댓글 전송 중 문제가 발생했어요');
    }
  }
  function handleCommentDelete(commentId: string) {
    if (!detailTx) return;
    Alert.alert('댓글 삭제', '이 댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try { await deleteComment.mutateAsync({ id: commentId, transactionId: detailTx.id }); }
        catch { Alert.alert('오류', '삭제 중 문제가 발생했어요'); }
      }},
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* 월 헤더 */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
          <TouchableOpacity onPress={prevMonth} className="w-10 h-10 items-center justify-center rounded-2xl bg-butter/70" activeOpacity={0.7}>
            <ChevronLeft size={20} color={Colors.brown} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setPickerYear(currentYear); setYearMonthModal(true); }} activeOpacity={0.7}>
            <Text className="font-ibm-bold text-2xl text-brown">{currentYear}년 {currentMonth + 1}월</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} className="w-10 h-10 items-center justify-center rounded-2xl bg-butter/70" activeOpacity={0.7}>
            <ChevronRight size={20} color={Colors.brown} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* 캘린더 카드 */}
        <View className="mx-4 mt-3 bg-white rounded-3xl p-4" style={{ shadowColor: Colors.butter, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
          <View className="flex-row mb-1">
            {WEEKDAYS.map((day, i) => (
              <View key={day} className="flex-1 items-center py-1.5">
                <Text className={`font-ibm-semibold text-xs ${i === 0 ? 'text-peach' : i === 6 ? 'text-lavender-dark' : 'text-brown/70'}`}>{day}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarDays.map((item, index) => {
              const isSelected = item.date === selectedDate;
              const txDots = transactionsByDate[item.date] ?? [];
              const hasExpense = txDots.some(t => t.type === 'expense');
              const hasIncome = txDots.some(t => t.type === 'income');
              const hasSchedule = (schedulesByDate[item.date] ?? []).length > 0;
              const hasFixed = fixedExpenses.some(fe => fe.due_day === item.day);
              const col = index % 7;
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
                  className="w-[14.28%] items-center py-1"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? 'bg-butter' : item.isToday ? 'bg-butter/50' : ''}`}
                    style={isSelected ? { shadowColor: Colors.butter, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } } : {}}
                  >
                    <Text className={`font-ibm-semibold text-sm ${
                      !item.isCurrentMonth ? 'text-brown/20'
                      : col === 0 ? (isSelected ? 'text-brown' : 'text-peach')
                      : col === 6 ? (isSelected ? 'text-brown' : 'text-lavender-dark')
                      : 'text-brown'
                    }`}>{item.day}</Text>
                  </View>
                  <View className="flex-row gap-0.5 mt-0.5 h-1.5 items-center">
                    {hasExpense && item.isCurrentMonth && <View className="w-1 h-1 rounded-full bg-peach" />}
                    {hasIncome && item.isCurrentMonth && <View className="w-1 h-1 rounded-full bg-lavender-dark" />}
                    {hasSchedule && item.isCurrentMonth && <View className="w-1 h-1 rounded-full bg-brown/40" />}
                    {hasFixed && <View className="w-1 h-1 rounded-full bg-butter" style={{ borderWidth: 0.5, borderColor: Colors.brown + '40' }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row gap-4 justify-end mt-2 pt-2 border-t border-cream-dark">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-peach" />
              <Text className="font-ibm-regular text-[10px] text-brown/50">지출</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-lavender-dark" />
              <Text className="font-ibm-regular text-[10px] text-brown/50">수입</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-brown/40" />
              <Text className="font-ibm-regular text-[10px] text-brown/50">일정</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-butter" style={{ borderWidth: 0.5, borderColor: Colors.brown + '40' }} />
              <Text className="font-ibm-regular text-[10px] text-brown/50">고정</Text>
            </View>
          </View>
        </View>

        {/* 선택일 요약 */}
        <View className="mx-4 mt-4 flex-row gap-3">
          <View className="flex-1 bg-butter/50 rounded-2xl px-4 py-3.5">
            <Text className="font-ibm-regular text-xs text-brown/60">지출</Text>
            <Text className="font-ibm-bold text-[15px] text-brown mt-1">{totalExpense > 0 ? `-${formatAmount(totalExpense)}원` : '-'}</Text>
          </View>
          <View className="flex-1 bg-lavender/60 rounded-2xl px-4 py-3.5">
            <Text className="font-ibm-regular text-xs text-brown/60">수입</Text>
            <Text className="font-ibm-bold text-[15px] text-brown mt-1">{totalIncome > 0 ? `+${formatAmount(totalIncome)}원` : '-'}</Text>
          </View>
        </View>

        {/* 거래 내역 */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-ibm-bold text-base text-brown">{getSelectedDateLabel(selectedDate)} 거래</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={openFixedCreate} className="w-8 h-8 rounded-full bg-butter/60 items-center justify-center" activeOpacity={0.7} style={{ shadowColor: Colors.butter, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <Repeat size={14} color={Colors.brown} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openTxCreate} className="w-8 h-8 rounded-full bg-butter items-center justify-center" activeOpacity={0.7} style={{ shadowColor: Colors.butter, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <Plus size={16} color={Colors.brown} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {txLoading ? (
            <View className="py-8 items-center"><ActivityIndicator color={Colors.butter} /></View>
          ) : selectedTransactions.length === 0 && selectedFixedExpenses.length === 0 ? (
            <View className="bg-cream-dark/40 rounded-3xl py-8 items-center gap-2">
              <CalendarX size={24} color={Colors.brown + '40'} strokeWidth={2} />
              <Text className="font-ibm-regular text-sm text-brown/40">거래 내역이 없어요</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {selectedTransactions.map(t => (
                <TouchableOpacity key={t.id} onPress={() => { setDetailTx(t); setCommentText(''); }} activeOpacity={0.8}>
                  <View className="bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3" style={{ shadowColor: Colors.brown, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
                    <View className={`w-10 h-10 rounded-2xl items-center justify-center ${t.type === 'expense' ? 'bg-peach/40' : 'bg-lavender/50'}`}>
                      {t.type === 'expense'
                        ? <TrendingDown size={18} color={Colors.peach} strokeWidth={2.5} />
                        : <TrendingUp size={18} color={Colors.lavender} strokeWidth={2.5} />}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <View className={`px-2 py-0.5 rounded-full ${getTagClassName(t.tag)}`}>
                          <Text className="font-ibm-semibold text-[10px] text-brown">{resolveTagLabel(t.tag, t.user_id)}</Text>
                        </View>
                        {t.categories?.name && <Text className="font-ibm-regular text-xs text-brown/60">{t.categories.name}</Text>}
                      </View>
                      <Text className="font-ibm-semibold text-sm text-brown mt-1">{t.memo ?? t.categories?.name ?? '내역'}</Text>
                    </View>
                    <View className="items-end gap-1.5">
                      <Text className={`font-ibm-bold text-sm ${t.type === 'expense' ? 'text-brown' : 'text-lavender-dark'}`}>
                        {t.type === 'expense' ? '-' : '+'}{formatAmount(t.amount)}원
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <MessageCircle size={13} color={Colors.brown + '50'} strokeWidth={2} />
                        <TouchableOpacity onPress={() => handleTxDelete(t.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Trash2 size={13} color={Colors.brown + '50'} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {selectedFixedExpenses.map(fe => (
                <TouchableOpacity key={fe.id} onPress={() => openFixedEdit(fe)} activeOpacity={0.8}>
                  <View className="bg-butter/20 rounded-3xl px-4 py-4 flex-row items-center gap-3" style={{ shadowColor: Colors.butter, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
                    <View className="w-10 h-10 rounded-2xl items-center justify-center bg-butter/60">
                      <Repeat size={18} color={Colors.brown} strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <View className="px-2 py-0.5 rounded-full bg-butter">
                          <Text className="font-ibm-semibold text-[10px] text-brown">고정지출</Text>
                        </View>
                        <Text className="font-ibm-regular text-xs text-brown/60">매월 {fe.due_day}일</Text>
                      </View>
                      <Text className="font-ibm-semibold text-sm text-brown mt-1">{fe.name}</Text>
                    </View>
                    <View className="items-end gap-1.5">
                      <Text className="font-ibm-bold text-sm text-brown">-{formatAmount(fe.amount)}원</Text>
                      <Text className="font-ibm-regular text-[10px] text-brown/40">탭하여 수정</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 일정 */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-ibm-bold text-base text-brown">{getSelectedDateLabel(selectedDate)} 일정</Text>
            <TouchableOpacity onPress={openScheduleCreate} className="w-8 h-8 rounded-full bg-lavender items-center justify-center" activeOpacity={0.7} style={{ shadowColor: Colors.lavender, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <Plus size={16} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {scheduleLoading ? (
            <View className="py-8 items-center"><ActivityIndicator color={Colors.lavender} /></View>
          ) : selectedSchedules.length === 0 ? (
            <View className="bg-cream-dark/40 rounded-3xl py-8 items-center gap-2">
              <CalendarDays size={24} color={Colors.brown + '40'} strokeWidth={2} />
              <Text className="font-ibm-regular text-sm text-brown/40">등록된 일정이 없어요</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {selectedSchedules.map(s => (
                <TouchableOpacity key={s.id} onPress={() => openScheduleEdit(s)} activeOpacity={0.8}>
                  <View className="bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3" style={{ shadowColor: Colors.brown, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
                    <View className="w-10 h-10 rounded-2xl items-center justify-center bg-lavender/50">
                      <CalendarDays size={18} color={Colors.brown} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <View className={`self-start px-2 py-0.5 rounded-full ${getTagClassName(s.tag)}`}>
                        <Text className="font-ibm-semibold text-[10px] text-brown">{resolveTagLabel(s.tag, s.user_id)}</Text>
                      </View>
                      <Text className="font-ibm-semibold text-sm text-brown mt-1">{s.title}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleScheduleDelete(s.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash2 size={13} color={Colors.brown + '50'} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 거래 추가/수정 모달 ── */}
      <Modal visible={txModal.visible} animationType="slide" transparent onRequestClose={() => setTxModal(s => ({ ...s, visible: false }))}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setTxModal(s => ({ ...s, visible: false }))} />
          <View className="bg-cream rounded-t-3xl px-6 pt-5 pb-10" style={{ shadowColor: Colors.brown, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-ibm-bold text-lg text-brown">{txModal.editingId ? '내역 수정' : `${getSelectedDateLabel(selectedDate)} 내역 추가`}</Text>
              <TouchableOpacity onPress={() => setTxModal(s => ({ ...s, visible: false }))}><X size={22} color={Colors.brown} strokeWidth={2} /></TouchableOpacity>
            </View>

            <View className="flex-row bg-white rounded-2xl p-1 mb-5" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              {(['expense', 'income'] as const).map(type => (
                <TouchableOpacity key={type} onPress={() => setTxModal(s => ({ ...s, form: { ...s.form, type } }))}
                  className={`flex-1 py-2.5 rounded-xl items-center ${txModal.form.type === type ? (type === 'expense' ? 'bg-peach' : 'bg-lavender') : ''}`} activeOpacity={0.7}>
                  <Text className={`font-ibm-semibold text-sm ${txModal.form.type === type ? 'text-brown' : 'text-brown/40'}`}>{type === 'expense' ? '지출' : '수입'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="bg-white rounded-2xl px-4 py-3.5 mb-4 flex-row items-center" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <Text className="font-ibm-semibold text-brown text-base mr-2">₩</Text>
              <TextInput
                className="flex-1 font-ibm-semibold text-base text-brown"
                placeholder="금액 입력"
                placeholderTextColor={Colors.brown + '40'}
                keyboardType="numeric"
                value={txModal.form.amount}
                onChangeText={v => setTxModal(s => ({ ...s, form: { ...s.form, amount: v.replace(/[^0-9]/g, '') } }))}
              />
            </View>

            <View className="bg-white rounded-2xl px-4 py-3.5 mb-5" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <TextInput
                className="font-ibm-regular text-sm text-brown"
                placeholder="메모 (선택)"
                placeholderTextColor={Colors.brown + '40'}
                value={txModal.form.memo}
                onChangeText={v => setTxModal(s => ({ ...s, form: { ...s.form, memo: v } }))}
                maxLength={50}
              />
            </View>

            <View className="flex-row gap-2 mb-6">
              {tagOptions.map(({ value, label }) => (
                <TouchableOpacity key={value} onPress={() => setTxModal(s => ({ ...s, form: { ...s.form, tag: value } }))}
                  className={`flex-1 py-2.5 rounded-2xl items-center ${txModal.form.tag === value ? getTagClassName(value) : 'bg-white'}`}
                  activeOpacity={0.7} style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } }}>
                  <Text className={`font-ibm-semibold text-sm ${txModal.form.tag === value ? 'text-brown' : 'text-brown/40'}`}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleTxSave} disabled={isTxSaving} className="bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2" activeOpacity={0.8} style={{ shadowColor: Colors.butter, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
              {isTxSaving ? <ActivityIndicator color={Colors.brown} /> : <><Check size={18} color={Colors.brown} strokeWidth={2.5} /><Text className="font-ibm-bold text-base text-brown">{txModal.editingId ? '수정 완료' : '저장'}</Text></>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 일정 추가/수정 모달 ── */}
      <Modal visible={scheduleModal.visible} animationType="slide" transparent onRequestClose={() => setScheduleModal(s => ({ ...s, visible: false }))}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setScheduleModal(s => ({ ...s, visible: false }))} />
          <View className="bg-cream rounded-t-3xl px-6 pt-5 pb-10" style={{ shadowColor: Colors.brown, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-ibm-bold text-lg text-brown">{scheduleModal.editingId ? '일정 수정' : `${getSelectedDateLabel(selectedDate)} 일정 추가`}</Text>
              <TouchableOpacity onPress={() => setScheduleModal(s => ({ ...s, visible: false }))}><X size={22} color={Colors.brown} strokeWidth={2} /></TouchableOpacity>
            </View>

            <View className="bg-white rounded-2xl px-4 py-3.5 mb-5" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <TextInput
                className="font-ibm-regular text-sm text-brown"
                placeholder="일정 제목"
                placeholderTextColor={Colors.brown + '40'}
                value={scheduleModal.form.title}
                onChangeText={v => setScheduleModal(s => ({ ...s, form: { ...s.form, title: v } }))}
                maxLength={30}
                autoFocus
              />
            </View>

            <View className="flex-row gap-2 mb-6">
              {tagOptions.map(({ value, label }) => (
                <TouchableOpacity key={value} onPress={() => setScheduleModal(s => ({ ...s, form: { ...s.form, tag: value } }))}
                  className={`flex-1 py-2.5 rounded-2xl items-center ${scheduleModal.form.tag === value ? getTagClassName(value) : 'bg-white'}`}
                  activeOpacity={0.7} style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } }}>
                  <Text className={`font-ibm-semibold text-sm ${scheduleModal.form.tag === value ? 'text-brown' : 'text-brown/40'}`}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleScheduleSave} disabled={isScheduleSaving} className="bg-lavender rounded-2xl py-4 items-center flex-row justify-center gap-2" activeOpacity={0.8} style={{ shadowColor: Colors.lavender, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
              {isScheduleSaving ? <ActivityIndicator color={Colors.brown} /> : <><Check size={18} color={Colors.brown} strokeWidth={2.5} /><Text className="font-ibm-bold text-base text-brown">{scheduleModal.editingId ? '수정 완료' : '저장'}</Text></>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 년월 선택 모달 ── */}
      <Modal visible={yearMonthModal} animationType="slide" transparent onRequestClose={() => setYearMonthModal(false)}>
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setYearMonthModal(false)} />
        <View className="bg-cream rounded-t-3xl px-6 pt-5 pb-10" style={{ shadowColor: Colors.brown, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }}>
          <View className="flex-row items-center justify-between mb-6">
            <Text className="font-ibm-bold text-lg text-brown">날짜 선택</Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => {
                  setPickerYear(todayDate.getFullYear());
                  setCurrentYear(todayDate.getFullYear());
                  setCurrentMonth(todayDate.getMonth());
                  setSelectedDate(todayStr);
                  setYearMonthModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="px-3 py-1.5 rounded-xl bg-butter"
                activeOpacity={0.7}
              >
                <Text className="font-ibm-semibold text-xs text-brown">오늘</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setYearMonthModal(false)}><X size={22} color={Colors.brown} strokeWidth={2} /></TouchableOpacity>
            </View>
          </View>

          {/* 년도 선택 */}
          <View className="flex-row items-center justify-center gap-6 mb-6">
            <TouchableOpacity onPress={() => setPickerYear(y => y - 1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ChevronLeft size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className="font-ibm-bold text-2xl text-brown w-24 text-center">{pickerYear}년</Text>
            <TouchableOpacity onPress={() => setPickerYear(y => y + 1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ChevronRight size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* 월 선택 그리드 */}
          <View className="flex-row flex-wrap gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
              const isSelected = pickerYear === currentYear && month === currentMonth + 1;
              return (
                <TouchableOpacity
                  key={month}
                  onPress={() => {
                    setCurrentYear(pickerYear);
                    setCurrentMonth(month - 1);
                    setYearMonthModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`rounded-2xl py-3 items-center ${isSelected ? 'bg-butter' : 'bg-white'}`}
                  style={{ width: '23%', shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } }}
                  activeOpacity={0.7}
                >
                  <Text className={`font-ibm-semibold text-sm ${isSelected ? 'text-brown' : 'text-brown/50'}`}>{month}월</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ── 고정지출 수정 모달 ── */}
      <Modal visible={fixedModal.visible} animationType="slide" transparent onRequestClose={() => setFixedModal(s => ({ ...s, visible: false }))}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setFixedModal(s => ({ ...s, visible: false }))} />
          <View className="bg-cream rounded-t-3xl px-6 pt-5 pb-10" style={{ shadowColor: Colors.brown, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-ibm-bold text-lg text-brown">{fixedModal.editingId ? '고정지출 수정' : '고정지출 추가'}</Text>
              <TouchableOpacity onPress={() => setFixedModal(s => ({ ...s, visible: false }))}><X size={22} color={Colors.brown} strokeWidth={2} /></TouchableOpacity>
            </View>

            <View className="bg-white rounded-2xl px-4 py-3.5 mb-4" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <TextInput
                className="font-ibm-regular text-sm text-brown"
                placeholder="고정지출 이름"
                placeholderTextColor={Colors.brown + '40'}
                value={fixedModal.form.name}
                onChangeText={v => setFixedModal(s => ({ ...s, form: { ...s.form, name: v } }))}
                maxLength={20}
              />
            </View>

            <View className="bg-white rounded-2xl px-4 py-3.5 mb-4 flex-row items-center" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <Text className="font-ibm-semibold text-brown text-base mr-2">₩</Text>
              <TextInput
                className="flex-1 font-ibm-semibold text-base text-brown"
                placeholder="금액 입력"
                placeholderTextColor={Colors.brown + '40'}
                keyboardType="numeric"
                value={fixedModal.form.amount}
                onChangeText={v => setFixedModal(s => ({ ...s, form: { ...s.form, amount: v.replace(/[^0-9]/g, '') } }))}
              />
            </View>

            <View className="bg-white rounded-2xl px-4 py-3 mb-6 flex-row items-center justify-between" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <Text className="font-ibm-regular text-sm text-brown/60">매월 결제일</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => setFixedModal(s => ({ ...s, form: { ...s.form, due_day: Math.max(1, s.form.due_day - 1) } }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <ChevronLeft size={18} color={Colors.brown} strokeWidth={2} />
                </TouchableOpacity>
                <Text className="font-ibm-bold text-base text-brown w-10 text-center">{fixedModal.form.due_day}일</Text>
                <TouchableOpacity onPress={() => setFixedModal(s => ({ ...s, form: { ...s.form, due_day: Math.min(31, s.form.due_day + 1) } }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <ChevronRight size={18} color={Colors.brown} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleFixedSave} disabled={createFixedExpense.isPending || updateFixedExpense.isPending} className="bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2" activeOpacity={0.8} style={{ shadowColor: Colors.butter, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
              {(createFixedExpense.isPending || updateFixedExpense.isPending) ? <ActivityIndicator color={Colors.brown} /> : <><Check size={18} color={Colors.brown} strokeWidth={2.5} /><Text className="font-ibm-bold text-base text-brown">{fixedModal.editingId ? '수정 완료' : '저장'}</Text></>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 거래 상세 + 댓글 모달 ── */}
      <Modal visible={!!detailTx} animationType="slide" transparent onRequestClose={() => setDetailTx(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setDetailTx(null)} />
          <View className="bg-cream rounded-t-3xl" style={{ maxHeight: SCREEN_HEIGHT * 0.45, shadowColor: Colors.brown, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }}>
            {/* 드래그 핸들 */}
            <View className="items-center pt-3 pb-1" {...detailPanResponder.panHandlers}>
              <View className="w-10 h-1 rounded-full bg-brown/20" />
            </View>

            {/* 헤더 */}
            <View className="px-6 pt-3 pb-4" {...detailPanResponder.panHandlers}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className={`self-start px-2.5 py-1 rounded-full mb-2 ${getTagClassName(detailTx?.tag ?? 'me')}`}>
                    <Text className="font-ibm-semibold text-[11px] text-brown">
                      {detailTx ? resolveTagLabel(detailTx.tag, detailTx.user_id) : ''}
                    </Text>
                  </View>
                  <Text className="font-ibm-bold text-base text-brown">{detailTx?.memo ?? detailTx?.categories?.name ?? '내역'}</Text>
                  <Text className={`font-ibm-bold text-lg mt-0.5 ${detailTx?.type === 'expense' ? 'text-brown' : 'text-lavender-dark'}`}>
                    {detailTx?.type === 'expense' ? '-' : '+'}{formatAmount(detailTx?.amount ?? 0)}원
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { if (detailTx) { setDetailTx(null); openTxEdit(detailTx); } }}>
                  <Text className="font-ibm-semibold text-xs text-brown/40">수정</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView ref={commentScrollRef} className="px-6" style={{ flexGrow: 0, maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {commentsLoading ? (
                <View className="py-4 items-center"><ActivityIndicator color={Colors.butter} /></View>
              ) : (
                <View className="gap-2 py-3">
                  {comments.map(c => {
                    const isMine = c.user_id === myId;
                    return (
                      <View key={c.id} className={`flex-row ${isMine ? 'flex-row-reverse' : ''}`}>
                        <View className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                          <View className={`rounded-2xl px-3 py-2 ${isMine ? 'bg-butter' : 'bg-white'}`} style={{ shadowColor: Colors.brown, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } }}>
                            <Text className="font-ibm-regular text-sm text-brown">{c.content}</Text>
                          </View>
                          <View className="flex-row items-center gap-2 mt-1">
                            <Text className="font-ibm-regular text-[10px] text-brown/30">{formatTime(c.created_at)}</Text>
                            {isMine && (
                              <TouchableOpacity onPress={() => handleCommentDelete(c.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                <Trash2 size={12} color={Colors.brown + '40'} strokeWidth={2} />
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

            <View className="flex-row items-center gap-3 px-6 py-4">
              <View className="flex-1 bg-white rounded-2xl px-4 py-3" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <TextInput
                  className="font-ibm-regular text-sm text-brown"
                  placeholder="댓글을 입력하세요"
                  placeholderTextColor={Colors.brown + '40'}
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={200}
                  returnKeyType="send"
                  onSubmitEditing={handleCommentSend}
                />
              </View>
              <TouchableOpacity onPress={handleCommentSend} disabled={!commentText.trim() || createComment.isPending}
                className="w-10 h-10 rounded-full bg-butter items-center justify-center"
                activeOpacity={0.7} style={{ shadowColor: Colors.butter, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                {createComment.isPending ? <ActivityIndicator size="small" color={Colors.brown} /> : <Send size={16} color={Colors.brown} strokeWidth={2.5} />}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
