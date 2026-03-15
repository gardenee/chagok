import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useCategories, useUpdateCategory } from '@/hooks/use-categories';
import { useMonthTransactions } from '@/hooks/use-transactions';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { CategorySummaryCard } from '@/components/budget/category-summary-card';
import { TransactionItem } from '@/components/budget/transaction-item';
import { MonthNavigator } from '@/components/budget/month-navigator';

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
    category && category.budget_amount ? String(category.budget_amount) : '',
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
    const raw = budgetInput.replace(/[^0-9]/g, '');
    const amount = raw === '' ? 0 : parseInt(raw, 10);
    const currentBudget = category.budget_amount ?? 0;
    if (amount === currentBudget) return;
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
      <SafeAreaView className='flex-1 bg-white'>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView className='flex-1 bg-white'>
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

  return (
    <SafeAreaView className='flex-1 bg-white'>
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
          <Text className='font-ibm-bold text-2xl text-brown-darker flex-1'>
            {category.name}
          </Text>
        </View>

        {/* 상단 요약 카드 */}
        <CategorySummaryCard
          category={category}
          totalAmount={totalAmount}
          budgetInput={budgetInput}
          isSavingBudget={isSavingBudget}
          onBudgetChange={v => setBudgetInput(v.replace(/[^0-9]/g, ''))}
          onBudgetSave={saveBudget}
        />

        {/* 월 네비게이터 */}
        <MonthNavigator
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          className='py-3'
        />

        {/* 거래내역 리스트 */}
        <View className='mx-4 gap-3'>
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
              <TransactionItem key={t.id} transaction={t} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
