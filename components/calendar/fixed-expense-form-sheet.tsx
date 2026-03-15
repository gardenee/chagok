import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
import type { FixedModalState } from './types';

interface FixedExpenseFormSheetProps {
  fixedModal: FixedModalState;
  onClose: () => void;
  onChange: (form: FixedModalState['form']) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function FixedExpenseFormSheet({
  fixedModal,
  onClose,
  onChange,
  onSave,
  isSaving,
}: FixedExpenseFormSheetProps) {
  return (
    <BottomSheet visible={fixedModal.visible} onClose={onClose}>
      <BottomSheetHeader
        title={fixedModal.editingId ? '고정지출 수정' : '고정지출 추가'}
        onClose={onClose}
        className='mb-6'
      />

      <ModalTextInput
        value={fixedModal.form.name}
        onChangeText={v => onChange({ ...fixedModal.form, name: v })}
        placeholder='항목 이름 (예: 월세, 넷플릭스)'
        maxLength={20}
        autoFocus
        className='mb-4'
      />

      <AmountInput
        value={fixedModal.form.amount}
        onChangeText={v => onChange({ ...fixedModal.form, amount: v })}
        className='mb-4'
      />

      <View className='mb-6'>
        <Text className='font-ibm-semibold text-lg text-neutral-500 mb-2.5 ml-1'>
          납부일
        </Text>
        <View className='flex-row flex-wrap gap-1.5'>
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
            const isSelected = fixedModal.form.due_day === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => onChange({ ...fixedModal.form, due_day: day })}
                className={`rounded-xl items-center justify-center ${isSelected ? 'bg-butter' : 'bg-neutral-100'}`}
                style={{ width: 42, height: 40 }}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-ibm-semibold text-sm ${isSelected ? 'text-brown' : 'text-neutral-500'}`}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <SaveButton
        onPress={onSave}
        isSaving={isSaving}
        label={fixedModal.editingId ? '수정 완료' : '저장'}
      />
    </BottomSheet>
  );
}
