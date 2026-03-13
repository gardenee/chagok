import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useState, useMemo, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { Pencil, Wallet, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useCategories } from '@/hooks/use-categories';
import { useMonthTransactions } from '@/hooks/use-transactions';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatAmount } from '@/utils/format';
import { BudgetSummaryCards } from '@/components/budget/budget-summary-cards';
import { ExpenseCard } from '@/components/budget/expense-card';
import { IncomeCard } from '@/components/budget/income-card';
import { MonthNavigator } from '@/components/budget/month-navigator';

export default function BudgetIndex() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

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
        ref={scrollRef}
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
        <MonthNavigator
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
        />

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
              <Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
                수입
              </Text>

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
              <Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
                지출
              </Text>

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
