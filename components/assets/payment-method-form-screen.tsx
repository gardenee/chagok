import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput } from '@/components/ui/modal-inputs';
import {
  PM_TYPE_OPTIONS,
  type PaymentMethodFormData,
} from '@/constants/payment-method';

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
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    setNameError(false);
  }, [editingId]);

  function handleSavePress() {
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    onSave();
  }

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
          <Text className='font-ibm-semibold text-lg text-neutral-500 mb-2.5 ml-1'>
            유형
          </Text>
          <View className='flex-row flex-wrap gap-2 mb-6'>
            {PM_TYPE_OPTIONS.map(({ key, label }) => {
              const isSelected = form.type === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => onChange({ ...form, type: key })}
                  className={`px-4 py-3 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-ibm-semibold text-lg ${isSelected ? 'text-brown-dark' : 'text-brown-dark/60'}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 이름 입력 */}
          <View className='mb-2 flex-row items-center ml-1'>
            <Text className='font-ibm-semibold text-lg text-neutral-500'>
              이름
            </Text>
            <Text
              className='font-ibm-semibold text-lg ml-0.5'
              style={{ color: Colors.peachDarker }}
            >
              *
            </Text>
          </View>
          <ModalTextInput
            value={form.name}
            onChangeText={v => {
              onChange({ ...form, name: v });
              if (nameError) setNameError(false);
            }}
            placeholder='결제수단 이름 (예: 신한카드, T-money)'
            maxLength={20}
            autoFocus
            className='mb-5'
            error={nameError}
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
            onPress={handleSavePress}
            isSaving={isSaving}
            label={editingId ? '수정 완료' : '저장'}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
