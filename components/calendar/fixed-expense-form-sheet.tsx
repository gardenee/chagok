import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
import { FormLabel } from '@/components/ui/form-label';
import { CategoryIconPicker } from '@/components/ui/category-icon-picker';
import {
  DueDayPickerModal,
  EOM_VALUE,
} from '@/components/ui/due-day-picker-modal';
import { CalendarDays } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { FixedModalState } from './types';
import type { Category } from '@/types/database';

interface FixedExpenseFormSheetProps {
  fixedModal: FixedModalState;
  categories: Category[];
  onClose: () => void;
  onChange: (form: FixedModalState['form']) => void;
  onSave: () => void;
  onCatCreate: () => void;
  onCatMgmt: () => void;
  isSaving: boolean;
}

export function FixedExpenseFormSheet({
  fixedModal,
  categories,
  onClose,
  onChange,
  onSave,
  onCatCreate,
  onCatMgmt,
  isSaving,
}: FixedExpenseFormSheetProps) {
  const [dueDayPickerVisible, setDueDayPickerVisible] = useState(false);
  const form = fixedModal.form;

  return (
    <BottomSheet visible={fixedModal.visible} onClose={onClose}>
      <BottomSheetHeader
        title={fixedModal.editingId ? '고정지출 수정' : '고정지출 추가'}
        onClose={onClose}
        className='mb-6'
      />

      <ModalTextInput
        value={form.name}
        onChangeText={v => onChange({ ...form, name: v })}
        placeholder='예: 월세, 넷플릭스'
        maxLength={20}
        autoFocus
        className='mb-4'
      />

      <AmountInput
        value={form.amount}
        onChangeText={v => onChange({ ...form, amount: v })}
        className='mb-4'
      />

      <CategoryIconPicker
        categories={categories}
        selectedId={form.category_id}
        onSelect={id => onChange({ ...form, category_id: id })}
        onAdd={onCatCreate}
        onManage={onCatMgmt}
        nameClassName='text-sm'
        labelClassName='text-neutral-700'
      />

      {/* 납부일 */}
      <View className='mb-4'>
        <FormLabel>납부일</FormLabel>
        <View className='flex-row gap-2'>
          <TouchableOpacity
            onPress={() => setDueDayPickerVisible(true)}
            activeOpacity={0.7}
            className='flex-1 bg-neutral-100 rounded-2xl px-4 flex-row items-center h-[48px]'
          >
            <CalendarDays
              size={16}
              color={Colors.neutralDark}
              strokeWidth={2}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
              pointerEvents='none'
            >
              <Text className='font-ibm-regular text-base text-neutral-800'>
                {form.due_day_mode === 'eom'
                  ? '매월 말일'
                  : `매월 ${form.due_day}일`}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (form.due_day_mode === 'eom') {
                onChange({ ...form, due_day_mode: 'day' });
              } else {
                onChange({ ...form, due_day_mode: 'eom' });
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={`rounded-2xl px-4 h-[48px] items-center justify-center ${form.due_day_mode === 'eom' ? 'bg-neutral-200' : 'bg-neutral-100'}`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm ${form.due_day_mode === 'eom' ? 'font-ibm-bold text-neutral-700' : 'font-ibm-semibold text-neutral-500'}`}
            >
              말일
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 영업일 보정 */}
      <View className='mb-6'>
        <FormLabel>영업일 보정</FormLabel>
        <View className='flex-row gap-2'>
          {[
            { key: 'none', label: '당일' },
            { key: 'prev', label: '전 영업일' },
            { key: 'next', label: '후 영업일' },
          ].map(opt => {
            const isSelected = form.business_day_adjust === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  onChange({
                    ...form,
                    business_day_adjust: opt.key as 'none' | 'prev' | 'next',
                  });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`flex-1 rounded-xl h-10 items-center justify-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm ${isSelected ? 'font-ibm-bold text-neutral-700' : 'font-ibm-semibold text-neutral-500'}`}
                >
                  {opt.label}
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

      <DueDayPickerModal
        visible={dueDayPickerVisible}
        selected={form.due_day_mode === 'eom' ? EOM_VALUE : form.due_day}
        onConfirm={value => {
          if (value === EOM_VALUE) {
            onChange({ ...form, due_day_mode: 'eom' });
          } else {
            onChange({ ...form, due_day: value, due_day_mode: 'day' });
          }
          setDueDayPickerVisible(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onDismiss={() => setDueDayPickerVisible(false)}
      />
    </BottomSheet>
  );
}
