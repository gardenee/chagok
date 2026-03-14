import { View, Text } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ItemCard } from '@/components/ui/item-card';
import { IconBox } from '@/components/ui/icon-box';
import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PM_TYPE_OPTIONS } from '@/constants/payment-method';
import {
  CREDIT_CARD_COMPANIES,
  DEBIT_CARD_BANKS,
  TRANSIT_PROVIDERS,
} from '@/constants/card-companies';
import { formatAmount } from '@/utils/format';
import type { PaymentMethod } from '@/types/database';

type Props = {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  onEdit: (pm: PaymentMethod) => void;
  onDelete: (id: string) => void;
};

export function PaymentMethodList({
  paymentMethods,
  isLoading,
  onEdit,
  onDelete,
}: Props) {
  function getPaymentMethodType(key: PaymentMethod['type']) {
    return (
      PM_TYPE_OPTIONS.find(t => t.key === key) ??
      PM_TYPE_OPTIONS[PM_TYPE_OPTIONS.length - 1]
    );
  }

  function getPmSubtitle(pm: PaymentMethod): string {
    const allCompanies = [
      ...CREDIT_CARD_COMPANIES,
      ...DEBIT_CARD_BANKS,
      ...TRANSIT_PROVIDERS,
    ];
    const company = pm.card_company
      ? allCompanies.find(c => c.id === pm.card_company)?.name
      : null;
    const parts: string[] = [];
    if (company) parts.push(company);
    if (pm.billing_day) parts.push(`${pm.billing_day}일 결제`);
    if (pm.limit != null) parts.push(`한도 ${formatAmount(pm.limit)}원`);
    if (pm.annual_fee != null)
      parts.push(`연회비 ${formatAmount(pm.annual_fee)}원`);
    return parts.length > 0
      ? parts.join(' · ')
      : getPaymentMethodType(pm.type).label;
  }

  return isLoading ? (
    <LoadingState />
  ) : paymentMethods.length === 0 ? (
    <EmptyState
      icon={CreditCard}
      title='등록된 결제수단이 없어요'
      description='+ 버튼으로 추가해보세요'
    />
  ) : (
    <View className='gap-2'>
      {paymentMethods.map(pm => {
        const pmType = getPaymentMethodType(pm.type);
        return (
          <SwipeableDeleteRow key={pm.id} onDelete={() => onDelete(pm.id)}>
            <ItemCard onPress={() => onEdit(pm)}>
              <IconBox color={pmType.color} size='md'>
                <pmType.Icon size={20} color={Colors.brown} strokeWidth={2.5} />
              </IconBox>
              <View className='flex-1'>
                <Text className='font-ibm-semibold text-sm text-neutral-800'>
                  {pm.name}
                </Text>
                <Text className='font-ibm-regular text-xs text-neutral-500 mt-0.5'>
                  {getPmSubtitle(pm)}
                </Text>
              </View>
            </ItemCard>
          </SwipeableDeleteRow>
        );
      })}
    </View>
  );
}
