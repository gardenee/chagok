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
} from 'react-native';
import { useState } from 'react';
import {
  Plus,
  Repeat,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import {
  useFixedExpenses,
  useCreateFixedExpense,
  useUpdateFixedExpense,
  useDeleteFixedExpense,
} from '../../hooks/use-fixed-expenses';
import { EmptyState } from '../../components/ui/empty-state';
import type { FixedExpense } from '../../types/database';

type FormData = {
  name: string;
  amount: string;
  due_day: number;
};

const INITIAL_FORM: FormData = { name: '', amount: '', due_day: 1 };

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

function ordinalDay(day: number): string {
  return `매월 ${day}일`;
}

export default function FixedScreen() {
  const [modal, setModal] = useState<{
    visible: boolean;
    editingId: string | null;
    form: FormData;
  }>({ visible: false, editingId: null, form: INITIAL_FORM });

  const { data: fixedExpenses = [], isLoading } = useFixedExpenses();
  const create = useCreateFixedExpense();
  const update = useUpdateFixedExpense();
  const remove = useDeleteFixedExpense();

  const isSaving = create.isPending || update.isPending;
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

    const payload = { name, amount, due_day: modal.form.due_day };
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

  function adjustDueDay(delta: number) {
    setModal(s => {
      const next = s.form.due_day + delta;
      if (next < 1 || next > 31) return s;
      return { ...s, form: { ...s.form, due_day: next } };
    });
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-6 pt-6 pb-2'>
          <Text className='font-ibm-bold text-2xl text-brown-darker'>
            고정지출
          </Text>
          <TouchableOpacity
            onPress={openCreate}
            className='w-10 h-10 rounded-full items-center justify-center'
            activeOpacity={0.6}
          >
            <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* 월 합계 카드 */}
        <View
          className='mx-4 mt-3 bg-butter rounded-3xl px-6 py-5'
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <View className='flex-row items-center gap-2 mb-1'>
            <Text className='font-ibm-semibold text-sm text-brown-dark mb-1'>
              매월 고정지출
            </Text>
          </View>
          <Text className='font-ibm-bold text-3xl text-brown-dark'>
            {formatAmount(totalAmount)}원
          </Text>
          <Text className='font-ibm-regular text-xs text-brown-dark mt-1'>
            총 {fixedExpenses.length}개 항목
          </Text>
        </View>

        {/* 목록 */}
        <View className='mx-4 mt-5'>
          {isLoading ? (
            <View className='py-12 items-center'>
              <ActivityIndicator color={Colors.butter} />
            </View>
          ) : fixedExpenses.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title='등록된 고정지출이 없어요'
              description='월세, 구독, 보험 등을 등록해보세요'
            />
          ) : (
            <View className='gap-2.5'>
              {fixedExpenses.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => openEdit(item)}
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
                    {/* 아이콘 */}
                    <View className='w-11 h-11 rounded-2xl items-center justify-center bg-peach/40'>
                      <Repeat
                        size={19}
                        color={Colors.peach}
                        strokeWidth={2.5}
                      />
                    </View>

                    {/* 이름 + 날짜 */}
                    <View className='flex-1'>
                      <Text className='font-ibm-semibold text-sm text-neutral-800'>
                        {item.name}
                      </Text>
                      <Text className='font-ibm-regular text-xs text-neutral-500 mt-0.5'>
                        {ordinalDay(item.due_day)}
                      </Text>
                    </View>

                    {/* 금액 + 삭제 */}
                    <View className='items-end gap-2'>
                      <Text className='font-ibm-bold text-sm text-neutral-800'>
                        {formatAmount(item.amount)}원
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id, item.name)}
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 추가 / 수정 모달 ── */}
      <Modal
        visible={modal.visible}
        animationType='slide'
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='flex-1 justify-end'
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={closeModal}
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
            {/* 모달 헤더 */}
            <View className='flex-row items-center justify-between mb-6'>
              <Text className='font-ibm-bold text-lg text-neutral-800'>
                {modal.editingId ? '고정지출 수정' : '고정지출 추가'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={22} color={Colors.brown} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* 항목명 */}
            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4'>
              <TextInput
                className='font-ibm-regular text-sm text-neutral-800'
                placeholder='항목 이름 (예: 월세, 넷플릭스)'
                placeholderTextColor='#A3A3A3'
                value={modal.form.name}
                onChangeText={v =>
                  setModal(s => ({ ...s, form: { ...s.form, name: v } }))
                }
                maxLength={20}
                autoFocus={!modal.editingId}
              />
            </View>

            {/* 금액 */}
            <View className='bg-neutral-100 rounded-2xl px-4 py-3.5 mb-4 flex-row items-center'>
              <Text className='font-ibm-semibold text-neutral-500 text-base mr-2'>
                ₩
              </Text>
              <TextInput
                className='flex-1 font-ibm-semibold text-base text-neutral-800'
                placeholder='금액 입력'
                placeholderTextColor='#A3A3A3'
                keyboardType='numeric'
                value={modal.form.amount}
                onChangeText={v =>
                  setModal(s => ({
                    ...s,
                    form: { ...s.form, amount: v.replace(/[^0-9]/g, '') },
                  }))
                }
              />
            </View>

            {/* 납부일 */}
            <View className='mb-6'>
              <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                납부일
              </Text>
              <View className='bg-neutral-100 rounded-2xl px-4 py-3 flex-row items-center justify-between'>
                <TouchableOpacity
                  onPress={() => adjustDueDay(-1)}
                  disabled={modal.form.due_day <= 1}
                  className='w-9 h-9 rounded-xl bg-cream items-center justify-center'
                  activeOpacity={0.7}
                >
                  <ChevronLeft
                    size={18}
                    color={
                      modal.form.due_day <= 1
                        ? Colors.brown + '30'
                        : Colors.brown
                    }
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>

                <Text className='font-ibm-bold text-base text-neutral-800'>
                  매월 {modal.form.due_day}일
                </Text>

                <TouchableOpacity
                  onPress={() => adjustDueDay(1)}
                  disabled={modal.form.due_day >= 31}
                  className='w-9 h-9 rounded-xl bg-cream items-center justify-center'
                  activeOpacity={0.7}
                >
                  <ChevronRight
                    size={18}
                    color={
                      modal.form.due_day >= 31
                        ? Colors.brown + '30'
                        : Colors.brown
                    }
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 저장 버튼 */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className='bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2'
              activeOpacity={0.8}
              style={{
                shadowColor: Colors.butter,
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.brown} />
              ) : (
                <>
                  <Check size={18} color={Colors.brown} strokeWidth={2.5} />
                  <Text className='font-ibm-bold text-base text-brown'>
                    {modal.editingId ? '수정 완료' : '저장'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
