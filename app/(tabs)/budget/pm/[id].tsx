import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useMonthTransactions } from '@/hooks/use-transactions';
import { useAuthStore } from '@/store/auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { PaymentMethodSummaryCard } from '@/components/budget/payment-method-summary-card';
import { TransactionItem } from '@/components/budget/transaction-item';
import { MonthNavigator } from '@/components/budget/month-navigator';

const NONE_ID = '__none__';

export default function PaymentMethodDetailScreen() {
  const router = useRouter();
  const {
    id,
    year: yearParam,
    month: monthParam,
  } = useLocalSearchParams<{ id: string; year?: string; month?: string }>();

  const today = new Date();
  const [year, setYear] = useState(
    yearParam ? parseInt(yearParam, 10) : today.getFullYear(),
  );
  const [month, setMonth] = useState(
    monthParam ? parseInt(monthParam, 10) : today.getMonth(),
  );

  const { session, userProfile } = useAuthStore();
  const myId = session?.user.id ?? '';
  const { data: members = [] } = useCoupleMembers();
  const partner = members.find(m => m.id !== myId);
  const myNickname = userProfile?.nickname ?? '나';
  const partnerNickname = partner?.nickname ?? '파트너';

  const { data: paymentMethods = [], isLoading: pmLoading } =
    usePaymentMethods();
  const { data: transactions = [], isLoading: txLoading } =
    useMonthTransactions(year, month);

  const isNone = id === NONE_ID;
  const pm = isNone ? null : (paymentMethods.find(p => p.id === id) ?? null);

  function resolveTagLabel(
    tag: 'me' | 'partner' | 'together' | null,
    creatorId: string,
  ): string | undefined {
    if (!tag) return undefined;
    if (tag === 'together') return '함께';
    const createdByMe = creatorId === myId;
    if (createdByMe) return tag === 'me' ? myNickname : partnerNickname;
    return tag === 'me' ? partnerNickname : myNickname;
  }

  const pmTransactions = useMemo(
    () =>
      transactions.filter(t => {
        if (t.type !== 'expense') return false;
        if (isNone) return !t.payment_method_id;
        return t.payment_method_id === id;
      }),
    [transactions, id, isNone],
  );

  const totalSpent = pmTransactions.reduce((s, t) => s + t.amount, 0);

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

  if (pmLoading) {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!isNone && !pm) {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <View className='px-6 pt-6'>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon={Wallet}
          title='결제수단을 찾을 수 없어요'
          containerClassName='mx-4 mt-8'
        />
      </SafeAreaView>
    );
  }

  const title = isNone ? '미지정' : (pm?.name ?? '');

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
            {title}
          </Text>
        </View>

        {/* 상단 요약 카드 */}
        <PaymentMethodSummaryCard pm={pm} spent={totalSpent} />

        {/* 월 네비게이터 */}
        <MonthNavigator
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          className='pt-3 pb-5'
        />

        {/* 거래내역 리스트 */}
        <View className='mx-4 gap-3'>
          {txLoading ? (
            <LoadingState />
          ) : pmTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title='내역이 없어요'
              description='이 결제수단의 지출이 없습니다'
            />
          ) : (
            pmTransactions.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                tagLabel={resolveTagLabel(t.tag, t.user_id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
