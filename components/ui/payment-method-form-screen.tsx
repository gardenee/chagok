import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  CreditCard,
  Bus,
  Gift,
  Star,
  Coins,
  Wallet,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { SaveButton } from './save-button';
import { ModalTextInput } from './modal-inputs';
import type { PaymentMethod } from '../../types/database';

export type PaymentMethodFormData = {
  name: string;
  type: PaymentMethod['type'];
};

export const INITIAL_PM_FORM: PaymentMethodFormData = {
  name: '',
  type: 'credit_card',
};

export type PmTypeOption = {
  key: PaymentMethod['type'];
  label: string;
  color: string;
  Icon: LucideIcon;
};

export const PM_TYPE_OPTIONS: PmTypeOption[] = [
  { key: 'credit_card', label: '신용카드', Icon: CreditCard, color: '#D4C5F0' },
  { key: 'debit_card', label: '체크카드', Icon: CreditCard, color: '#B5D5F0' },
  { key: 'transit', label: '교통카드', Icon: Bus, color: '#A8D8B0' },
  { key: 'welfare', label: '복지카드', Icon: Gift, color: '#F5D0A0' },
  { key: 'points', label: '포인트', Icon: Star, color: '#FAD97A' },
  { key: 'prepaid', label: '선불', Icon: Coins, color: '#F7B8A0' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#F0C5D5' },
];

export function getPmColor(type: PaymentMethod['type']): string {
  return PM_TYPE_OPTIONS.find(t => t.key === type)?.color ?? '#F0C5D5';
}

type Props = {
  editingId: string | null;
  form: PaymentMethodFormData;
  isSaving: boolean;
  onBack: () => void;
  onChange: (form: PaymentMethodFormData) => void;
  onSave: () => void;
  onDelete?: () => void;
};

export function PaymentMethodFormScreen({
  editingId,
  form,
  isSaving,
  onBack,
  onChange,
  onSave,
  onDelete,
}: Props) {
  return (
    <SafeAreaView className='flex-1 bg-white'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps='handled'
        >
          {/* 헤더 */}
          <View className='flex-row items-center justify-between pt-5 mb-6'>
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className='font-ibm-bold text-lg text-neutral-800'>
              {editingId ? '결제수단 수정' : '결제수단 추가'}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {/* 유형 선택 */}
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            유형
          </Text>
          <View className='flex-row flex-wrap gap-2 mb-6'>
            {PM_TYPE_OPTIONS.map(({ key, label }) => {
              const isSelected = form.type === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => onChange({ ...form, type: key })}
                  className={`px-3 py-2 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown-dark' : 'text-brown-dark/60'}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 이름 입력 */}
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            이름
          </Text>
          <ModalTextInput
            value={form.name}
            onChangeText={v => onChange({ ...form, name: v })}
            placeholder='결제수단 이름 (예: 신한카드, T-money)'
            maxLength={20}
            autoFocus
            className='mb-5'
          />
        </ScrollView>

        {/* 하단 버튼 */}
        <View className='px-6 pb-6 pt-3 gap-3'>
          {editingId && onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              activeOpacity={0.8}
              className='rounded-2xl items-center'
              style={{
                backgroundColor: Colors.cream,
                borderWidth: 1.5,
                borderColor: Colors.peachDark,
                paddingVertical: 14,
              }}
            >
              <Text
                className='font-ibm-semibold text-base'
                style={{ color: Colors.peachDark }}
              >
                결제수단 삭제
              </Text>
            </TouchableOpacity>
          )}
          <SaveButton
            onPress={onSave}
            isSaving={isSaving}
            label={editingId ? '수정 완료' : '저장'}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
