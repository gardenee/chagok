import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Wallet,
  TrendingUp,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';
import { useCategories } from '../../../hooks/use-categories';
import { useMonthTransactions } from '../../../hooks/use-transactions';
import { IconBox } from '../../../components/ui/icon-box';
import { LoadingState } from '../../../components/ui/loading-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { ICON_MAP } from '../../../components/ui/category-form-screen';
import { formatAmount } from '../../../utils/format';
import { BudgetSummaryCards } from '../../../components/budget/budget-summary-cards';
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

function ExpenseCard({
  c,
  spent,
  onPress,
}: {
  c: Category;
  spent: number;
  onPress: () => void;
}) {
  const hasBudget = c.budget_amount > 0;
  const over = hasBudget && spent > c.budget_amount;
  const diff = hasBudget ? c.budget_amount - spent : 0;
  const ratio = hasBudget ? Math.min(spent / c.budget_amount, 1) : 0;

  const barColor = (() => {
    if (!hasBudget) return Colors.olive;
    const pct = (spent / c.budget_amount) * 100;
    if (pct >= 100) return Colors.peachDark;
    if (pct >= 80) return Colors.butter;
    return Colors.olive;
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className='bg-white rounded-3xl p-3' style={Shadows.primary}>
        {/* 1행: 아이콘 + 카테고리명 + 목표·사용 수치 */}
        <View className='flex-row items-center gap-2 mb-2'>
          <IconBox color={c.color}>
            <CategoryIcon iconKey={c.icon} color={c.color} />
          </IconBox>
          <Text
            className='font-ibm-semibold text-sm text-neutral-700 flex-1'
            numberOfLines={1}
          >
            {c.name}
          </Text>
          {hasBudget ? (
            <View className='flex-row items-baseline gap-1'>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                목표
              </Text>
              <Text className='font-ibm-bold text-sm text-neutral-700'>
                {formatAmount(c.budget_amount)}원
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-300'>
                ·
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                사용
              </Text>
              <Text
                className='font-ibm-bold text-sm'
                style={{ color: over ? Colors.peachDark : '#404040' }}
              >
                {formatAmount(spent)}원
              </Text>
            </View>
          ) : (
            <View className='flex-row items-baseline gap-1'>
              <Text className='font-ibm-bold text-sm text-neutral-700'>
                {formatAmount(spent)}원
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                이번달 사용
              </Text>
            </View>
          )}
        </View>

        {/* 2행: 프로그레스바(flex:2 고정) + 차액 뱃지(flex:1) */}
        {hasBudget && (
          <View className='flex-row items-center gap-2'>
            <View
              className='rounded-full overflow-hidden'
              style={{ flex: 2, height: 6, backgroundColor: '#f0f0f0' }}
            >
              <View
                className='rounded-full h-full'
                style={{ width: `${ratio * 100}%`, backgroundColor: barColor }}
              />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View
                className='px-2 py-0.5 rounded-full'
                style={{
                  backgroundColor: over
                    ? `${Colors.peach}40`
                    : `${Colors.olive}30`,
                }}
              >
                <Text
                  className='font-ibm-bold text-xs'
                  style={{
                    color: over ? Colors.peachDarker : Colors.oliveDarker,
                  }}
                >
                  {over
                    ? `초과 ${formatAmount(Math.abs(diff))}원`
                    : `절약 +${formatAmount(diff)}원`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function IncomeCard({
  c,
  income,
  onPress,
}: {
  c: Category;
  income: number;
  onPress: () => void;
}) {
  const hasTarget = c.budget_amount > 0;
  const over = hasTarget && income > c.budget_amount;
  const diff = hasTarget ? income - c.budget_amount : 0;

  const incomeRatio = hasTarget ? Math.min(income / c.budget_amount, 1) : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className='bg-white rounded-3xl p-3' style={Shadows.primary}>
        {/* 1행: 아이콘 + 카테고리명 + 목표·수입 수치 */}
        <View className='flex-row items-center gap-2 mb-2'>
          <IconBox color={c.color}>
            <CategoryIcon iconKey={c.icon} color={c.color} />
          </IconBox>
          <Text
            className='font-ibm-semibold text-sm text-neutral-700 flex-1'
            numberOfLines={1}
          >
            {c.name}
          </Text>
          {hasTarget ? (
            <View className='flex-row items-baseline gap-1'>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                목표
              </Text>
              <Text className='font-ibm-bold text-sm text-neutral-700'>
                {formatAmount(c.budget_amount)}원
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-300'>
                ·
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                수입
              </Text>
              <Text
                className='font-ibm-bold text-sm'
                style={{ color: over ? Colors.oliveDark : '#404040' }}
              >
                {formatAmount(income)}원
              </Text>
            </View>
          ) : (
            <View className='flex-row items-baseline gap-1'>
              <Text className='font-ibm-bold text-sm text-neutral-700'>
                {formatAmount(income)}원
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                이번달 수입
              </Text>
            </View>
          )}
        </View>

        {/* 2행: 프로그레스바(flex:2 고정) + 차액 뱃지(flex:1) */}
        {hasTarget && (
          <View className='flex-row items-center gap-2'>
            <View
              className='rounded-full overflow-hidden'
              style={{ flex: 2, height: 6, backgroundColor: '#f0f0f0' }}
            >
              <View
                className='rounded-full h-full'
                style={{
                  width: `${incomeRatio * 100}%`,
                  backgroundColor: over ? Colors.oliveDark : Colors.olive,
                }}
              />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View
                className='px-2 py-0.5 rounded-full'
                style={{
                  backgroundColor: over
                    ? `${Colors.olive}30`
                    : `${Colors.peach}40`,
                }}
              >
                <Text
                  className='font-ibm-bold text-xs'
                  style={{
                    color: over ? Colors.oliveDarker : Colors.peachDarker,
                  }}
                >
                  {over
                    ? `초과달성 +${formatAmount(diff)}원`
                    : `미달 -${formatAmount(Math.abs(diff))}원`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function BudgetIndex() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: categories = [], isLoading } = useCategories();
  const { data: transactions = [] } = useMonthTransactions(year, month);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.category_id) {
        map[t.category_id] = (map[t.category_id] ?? 0) + t.amount;
      }
    }
    return map;
  }, [transactions]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'income' && t.category_id) {
        map[t.category_id] = (map[t.category_id] ?? 0) + t.amount;
      }
    }
    return map;
  }, [transactions]);

  const totalBudget = expenseCategories.reduce(
    (s, c) => s + c.budget_amount,
    0,
  );
  const totalSpent = expenseCategories.reduce(
    (s, c) => s + (spendingByCategory[c.id] ?? 0),
    0,
  );
  const totalIncome = incomeCategories.reduce(
    (s, c) => s + (incomeByCategory[c.id] ?? 0),
    0,
  );
  const isOver = totalSpent > totalBudget && totalBudget > 0;

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

  function goToDetail(id: string) {
    router.push(`/budget/${id}?year=${year}&month=${month}`);
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-6 pt-6 pb-2'>
          <Text className='font-ibm-bold text-2xl text-brown-darker'>
            예산·결산
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/budget/categories')}
            className='w-10 h-10 rounded-full items-center justify-center'
            activeOpacity={0.6}
          >
            <Pencil size={20} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* 월 네비게이터 */}
        <View className='flex-row items-center justify-center gap-5 px-6 pt-1 pb-4'>
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

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* 요약 카드 */}
            <BudgetSummaryCards
              totalIncome={totalIncome}
              totalSpent={totalSpent}
              totalBudget={totalBudget}
            />

            {/* 수입 섹션 */}
            <View className='mx-4 mb-6'>
              <View className='flex-row items-center justify-between mb-3'>
                <Text className='font-ibm-bold text-base text-neutral-700'>
                  수입
                </Text>
                {totalIncome > 0 && (
                  <View className='flex-row items-center gap-1'>
                    <TrendingUp
                      size={14}
                      color={Colors.oliveDark}
                      strokeWidth={2}
                    />
                    <Text
                      className='font-ibm-semibold text-sm'
                      style={{ color: Colors.oliveDark }}
                    >
                      {formatAmount(totalIncome)}원
                    </Text>
                  </View>
                )}
              </View>

              {incomeCategories.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title='수입 카테고리가 없어요'
                  description='연필 버튼으로 추가해보세요'
                />
              ) : (
                <View className='gap-3'>
                  {incomeCategories.map(c => (
                    <IncomeCard
                      key={c.id}
                      c={c}
                      income={incomeByCategory[c.id] ?? 0}
                      onPress={() => goToDetail(c.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* 지출 섹션 */}
            <View className='mx-4'>
              <View className='flex-row items-center justify-between mb-3'>
                <Text className='font-ibm-bold text-base text-neutral-700'>
                  지출
                </Text>
                {totalBudget > 0 && (
                  <View className='flex-row items-baseline gap-1'>
                    <Text
                      className='font-ibm-bold text-sm'
                      style={{
                        color: isOver ? Colors.peachDark : Colors.brown,
                      }}
                    >
                      {formatAmount(totalSpent)}원
                    </Text>
                    <Text className='font-ibm-regular text-xs text-neutral-400'>
                      / {formatAmount(totalBudget)}원
                    </Text>
                  </View>
                )}
              </View>

              {expenseCategories.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title='지출 카테고리가 없어요'
                  description='연필 버튼으로 추가해보세요'
                />
              ) : (
                <View className='gap-3'>
                  {expenseCategories.map(c => (
                    <ExpenseCard
                      key={c.id}
                      c={c}
                      spent={spendingByCategory[c.id] ?? 0}
                      onPress={() => goToDetail(c.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
