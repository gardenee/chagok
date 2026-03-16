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
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { useCategories } from '@/hooks/use-categories';
import { fetchCategories } from '@/services/categories';
import { useAuthStore } from '@/store/auth';
import { useMonthTransactions } from '@/hooks/use-transactions';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatAmount } from '@/utils/format';
import { BudgetSummaryCards } from '@/components/budget/budget-summary-cards';
import { ExpenseCard } from '@/components/budget/expense-card';
import { IncomeCard } from '@/components/budget/income-card';
import { PaymentMethodExpenseCard } from '@/components/budget/payment-method-expense-card';
import { MonthNavigator } from '@/components/budget/month-navigator';

export default function BudgetIndex() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const [expenseView, setExpenseView] = useState<'category' | 'payment'>(
    'category',
  );

  const { data: categories = [], isLoading } = useCategories();
  const { data: transactions = [] } = useMonthTransactions(year, month);
  const { data: paymentMethods = [] } = usePaymentMethods();

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

  const spendingByPaymentMethod = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense') {
        const key = t.payment_method_id ?? '__none__';
        map[key] = (map[key] ?? 0) + t.amount;
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
          <Text className='font-ibm-bold text-3xl text-brown-darker'>
            예산·결산
          </Text>
          <TouchableOpacity
            onPress={() => {
              const coupleId = userProfile?.couple_id;
              if (coupleId) {
                queryClient.prefetchQuery({
                  queryKey: ['categories', coupleId],
                  queryFn: () => fetchCategories(coupleId),
                });
              }
              router.push('/budget/categories');
            }}
            className='w-11 h-11 rounded-full items-center justify-center'
            activeOpacity={0.6}
          >
            <Pencil size={21} color={Colors.brownDarker} strokeWidth={2.5} />
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
              <Text className='font-ibm-bold text-lg text-neutral-700 mb-3.5'>
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
              <View className='flex-row items-center justify-between mb-3'>
                <Text className='font-ibm-bold text-lg text-neutral-700'>
                  지출
                </Text>
                <View className='flex-row bg-neutral-100 rounded-full p-1'>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpenseView('category');
                    }}
                    className='px-3 py-1 rounded-full'
                    style={{
                      backgroundColor:
                        expenseView === 'category' ? 'white' : 'transparent',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className='font-ibm-semibold text-sm'
                      style={{
                        color:
                          expenseView === 'category'
                            ? Colors.brownDarker
                            : Colors.neutralLighter,
                      }}
                    >
                      카테고리
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpenseView('payment');
                    }}
                    className='px-3 py-1 rounded-full'
                    style={{
                      backgroundColor:
                        expenseView === 'payment' ? 'white' : 'transparent',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className='font-ibm-semibold text-sm'
                      style={{
                        color:
                          expenseView === 'payment'
                            ? Colors.brownDarker
                            : Colors.neutralLighter,
                      }}
                    >
                      결제수단
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {expenseView === 'category' ? (
                expenseCategories.length === 0 ? (
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
                )
              ) : paymentMethods.filter(
                  pm => (spendingByPaymentMethod[pm.id] ?? 0) > 0,
                ).length === 0 && !spendingByPaymentMethod['__none__'] ? (
                <EmptyState
                  icon={Wallet}
                  title='이번 달 결제 내역이 없어요'
                  description='지출을 기록하면 여기에 표시돼요'
                />
              ) : (
                <View className='gap-3'>
                  {paymentMethods
                    .filter(pm => (spendingByPaymentMethod[pm.id] ?? 0) > 0)
                    .map(pm => (
                      <PaymentMethodExpenseCard
                        key={pm.id}
                        pm={pm}
                        spent={spendingByPaymentMethod[pm.id] ?? 0}
                      />
                    ))}
                  {(spendingByPaymentMethod['__none__'] ?? 0) > 0 && (
                    <View
                      className='bg-white rounded-3xl p-4'
                      style={Shadows.primary}
                    >
                      <View className='flex-row items-center gap-2.5'>
                        <View className='w-10 h-10 rounded-2xl bg-neutral-100 items-center justify-center'>
                          <Wallet
                            size={19}
                            color={Colors.neutralLighter}
                            strokeWidth={2.5}
                          />
                        </View>
                        <Text className='font-ibm-semibold text-base text-neutral-700 flex-1'>
                          미지정
                        </Text>
                        <View className='flex-row items-baseline gap-1'>
                          <Text className='font-ibm-regular text-sm text-neutral-600'>
                            사용
                          </Text>
                          <Text className='font-ibm-bold text-base text-neutral-700'>
                            {formatAmount(
                              spendingByPaymentMethod['__none__'] ?? 0,
                            )}
                            원
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
