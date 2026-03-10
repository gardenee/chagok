import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';
import {
  useCategories,
  useUpdateCategory,
} from '../../../hooks/use-categories';
import { useMonthTransactions } from '../../../hooks/use-transactions';
import { IconBox } from '../../../components/ui/icon-box';
import { LoadingState } from '../../../components/ui/loading-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { TagPill } from '../../../components/ui/color-pill';
import { ICON_MAP } from '../../../components/ui/category-form-screen';
import { formatAmount } from '../../../utils/format';
import type { LucideIcon } from 'lucide-react-native';

const TAG_LABELS: Record<string, string> = {
  me: '나',
  partner: '파트너',
  together: '함께',
};

function CategoryIcon({
  iconKey,
  color,
  size = 20,
}: {
  iconKey: string;
  color: string;
  size?: number;
}) {
  const Icon: LucideIcon = ICON_MAP[iconKey] ?? Wallet;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
}

export default function CategoryDetailScreen() {
  const router = useRouter();
  const {
    id,
    year: yearParam,
    month: monthParam,
  } = useLocalSearchParams<{
    id: string;
    year?: string;
    month?: string;
  }>();

  const today = new Date();
  const [year, setYear] = useState(
    yearParam ? parseInt(yearParam, 10) : today.getFullYear(),
  );
  const [month, setMonth] = useState(
    monthParam ? parseInt(monthParam, 10) : today.getMonth(),
  );

  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: transactions = [], isLoading: txLoading } =
    useMonthTransactions(year, month);
  const updateCategory = useUpdateCategory();

  const category = categories.find(c => c.id === id);

  const [budgetInput, setBudgetInput] = useState<string>(
    category ? String(category.budget_amount) : '',
  );
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const categoryTransactions = useMemo(
    () => transactions.filter(t => t.category_id === id),
    [transactions, id],
  );

  const totalAmount = categoryTransactions.reduce((s, t) => s + t.amount, 0);

  function prevMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else setMonth(m => m - 1);
  }

  function nextMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else setMonth(m => m + 1);
  }

  async function saveBudget() {
    if (!category) return;
    const amount = parseInt(budgetInput.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) {
      Alert.alert('입력 오류', '예산을 올바르게 입력해주세요');
      return;
    }
    try {
      setIsSavingBudget(true);
      await updateCategory.mutateAsync({
        id: category.id,
        budget_amount: amount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('오류', '예산 저장 중 문제가 발생했어요');
    } finally {
      setIsSavingBudget(false);
    }
  }

  if (catLoading) {
    return (
      <SafeAreaView className='flex-1 bg-cream'>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView className='flex-1 bg-cream'>
        <View className='px-6 pt-6'>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon={Wallet}
          title='카테고리를 찾을 수 없어요'
          containerClassName='mx-4 mt-8'
        />
      </SafeAreaView>
    );
  }

  const isExpense = category.type === 'expense';
  const ratio =
    category.budget_amount > 0
      ? Math.min(totalAmount / category.budget_amount, 1)
      : 0;
  const over =
    totalAmount > category.budget_amount && category.budget_amount > 0;

  return (
    <SafeAreaView className='flex-1 bg-cream'>
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
            {category.name}
          </Text>
        </View>

        {/* 상단 요약 카드 */}
        <View
          className='mx-4 rounded-3xl p-5 mb-4'
          style={{ backgroundColor: Colors.butter, ...Shadows.soft }}
        >
          <View className='flex-row items-center gap-3 mb-4'>
            <IconBox color={category.color} size='md'>
              <CategoryIcon iconKey={category.icon} color={category.color} />
            </IconBox>
            <Text className='font-ibm-bold text-lg text-brown'>
              {category.name}
            </Text>
          </View>

          {isExpense ? (
            <>
              <Text className='font-ibm-regular text-xs text-brown/70 mb-1'>
                이번달 지출
              </Text>
              <Text className='font-ibm-bold text-2xl text-brown mb-3'>
                {formatAmount(totalAmount)}원
              </Text>

              {/* 예산 인풋 */}
              <View className='flex-row items-center gap-2 mb-3'>
                <Text className='font-ibm-semibold text-xs text-brown/70'>
                  월 예산
                </Text>
                <View
                  className='flex-1 flex-row items-center bg-white/70 rounded-xl px-3'
                  style={{ height: 36 }}
                >
                  <TextInput
                    className='flex-1 font-ibm-semibold text-sm text-brown'
                    value={budgetInput}
                    onChangeText={v => setBudgetInput(v.replace(/[^0-9]/g, ''))}
                    keyboardType='numeric'
                    placeholder='예산 금액'
                    placeholderTextColor={Colors.brown + '50'}
                    onBlur={saveBudget}
                    returnKeyType='done'
                    onSubmitEditing={saveBudget}
                  />
                  <Text className='font-ibm-regular text-sm text-brown/60'>
                    원
                  </Text>
                </View>
                {isSavingBudget && (
                  <Text className='font-ibm-regular text-xs text-brown/50'>
                    저장중...
                  </Text>
                )}
              </View>

              {/* 프로그레스 바 */}
              {category.budget_amount > 0 && (
                <>
                  <View className='bg-brown/15 rounded-full h-2 mb-1'>
                    <View
                      className='h-2 rounded-full'
                      style={{
                        width: `${ratio * 100}%`,
                        backgroundColor: over ? Colors.peach : category.color,
                      }}
                    />
                  </View>
                  <Text className='font-ibm-semibold text-xs text-brown/70'>
                    {over
                      ? `${formatAmount(totalAmount - category.budget_amount)}원 초과`
                      : `${formatAmount(category.budget_amount - totalAmount)}원 남음`}
                  </Text>
                </>
              )}
            </>
          ) : (
            <>
              <Text className='font-ibm-regular text-xs text-brown/70 mb-1'>
                이번달 수입
              </Text>
              <Text className='font-ibm-bold text-2xl text-brown'>
                {formatAmount(totalAmount)}원
              </Text>
            </>
          )}
        </View>

        {/* 월 네비게이터 */}
        <View className='flex-row items-center justify-center gap-5 px-6 py-3'>
          <TouchableOpacity
            onPress={prevMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={20} color='#404040' strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className='font-ibm-semibold text-base text-neutral-700 w-24 text-center'>
            {year}년 {month + 1}월
          </Text>
          <TouchableOpacity
            onPress={nextMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronRight size={20} color='#404040' strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* 거래내역 리스트 */}
        <View className='mx-4 gap-2.5'>
          {txLoading ? (
            <LoadingState />
          ) : categoryTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title='내역이 없어요'
              description='이 카테고리의 거래가 없습니다'
            />
          ) : (
            categoryTransactions.map(t => (
              <View
                key={t.id}
                className='bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3'
                style={Shadows.soft}
              >
                <View className='flex-1'>
                  <View className='flex-row items-center gap-2 mb-0.5'>
                    <Text className='font-ibm-regular text-xs text-neutral-400'>
                      {t.date.slice(5).replace('-', '.')}
                    </Text>
                    <TagPill tag={t.tag} label={TAG_LABELS[t.tag] ?? t.tag} />
                  </View>
                  <Text className='font-ibm-semibold text-sm text-neutral-700'>
                    {t.memo ?? '메모 없음'}
                  </Text>
                </View>
                <Text
                  className='font-ibm-bold text-base'
                  style={{
                    color:
                      t.type === 'income'
                        ? Colors.oliveDark
                        : Colors.brownDarker,
                  }}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatAmount(t.amount)}원
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
