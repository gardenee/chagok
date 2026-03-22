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
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { DeleteButton } from '@/components/ui/delete-button';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
import { FormLabel } from '@/components/ui/form-label';
import { CategoryIconPicker } from '@/components/ui/category-icon-picker';
import { DayGrid } from '@/components/ui/day-grid';
import type { Category } from '@/types/database';

export type FormData = {
  name: string;
  amount: string;
  due_day: number;
  due_day_mode: 'day' | 'eom';
  business_day_adjust: 'none' | 'prev' | 'next';
  category_id: string | null;
};

export const INITIAL_FORM: FormData = {
  name: '',
  amount: '',
  due_day: 1,
  due_day_mode: 'day',
  business_day_adjust: 'none',
  category_id: null,
};

type Props = {
  editingId: string | null;
  form: FormData;
  isSaving: boolean;
  categories: Category[];
  onChange: (form: FormData) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onCatCreate: () => void;
  onCatMgmt: () => void;
};

export function FixedExpenseForm({
  editingId,
  form,
  isSaving,
  categories,
  onChange,
  onClose,
  onSave,
  onDelete,
  onCatCreate,
  onCatMgmt,
}: Props) {
  const [errors, setErrors] = useState({ name: false, amountMsg: '' });

  useEffect(() => {
    setErrors({ name: false, amountMsg: '' });
  }, [editingId]);

  function handleSavePress() {
    const nameError = !form.name.trim();
    const parsed = parseInt(form.amount, 10);
    const amountMsg =
      errors.amountMsg ||
      (!form.amount || parsed <= 0 ? '금액을 입력해주세요' : '');
    if (nameError || amountMsg) {
      setErrors({ name: nameError, amountMsg });
      return;
    }
    onSave();
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-6 pt-5 mb-6'>
          <View style={{ width: 22 }} />
          <Text className='font-ibm-bold text-xl text-neutral-800'>
            {editingId ? '고정지출 수정' : '고정지출 추가'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color={Colors.neutralLight} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps='handled'
        >
          <FormLabel required className='text-neutral-700'>
            이름
          </FormLabel>
          <ModalTextInput
            value={form.name}
            onChangeText={v => {
              onChange({ ...form, name: v });
              if (errors.name) setErrors(e => ({ ...e, name: false }));
            }}
            placeholder='예: 월세, 넷플릭스'
            maxLength={20}
            autoFocus={!editingId}
            className='mb-4'
            error={errors.name}
          />

          <FormLabel required className='text-neutral-700'>
            금액
          </FormLabel>
          <AmountInput
            value={form.amount}
            onChangeText={v => {
              onChange({ ...form, amount: v });
              const n = parseInt(v, 10);
              setErrors(e => ({
                ...e,
                amountMsg: n > 2_147_483_647 ? '최대 입력값을 초과했어요' : '',
              }));
            }}
            className={errors.amountMsg ? 'mb-1' : 'mb-4'}
            error={!!errors.amountMsg}
            maxLength={10}
          />
          {!!errors.amountMsg && (
            <Text
              className='font-ibm-regular text-sm mb-4 ml-1'
              style={{ color: Colors.peachDarker }}
            >
              {errors.amountMsg}
            </Text>
          )}

          {/* 카테고리 선택 */}
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
          <View className='mb-6'>
            <Text className='font-ibm-semibold text-base text-neutral-700 mb-2.5 ml-1'>
              납부일
            </Text>
            <View className='flex-row gap-2 mb-2'>
              <TouchableOpacity
                onPress={() => onChange({ ...form, due_day_mode: 'eom' })}
                className={`rounded-xl px-3.5 h-10 items-center justify-center ${form.due_day_mode === 'eom' ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                activeOpacity={0.7}
              >
                <Text
                  className={`${form.due_day_mode === 'eom' ? 'font-ibm-bold text-neutral-700' : 'font-ibm-semibold text-neutral-500'} text-sm`}
                >
                  말일
                </Text>
              </TouchableOpacity>
            </View>
            <DayGrid
              days={Array.from({ length: 31 }, (_, i) => i + 1)}
              selected={form.due_day_mode === 'day' ? form.due_day : null}
              onSelect={day =>
                onChange({ ...form, due_day: day, due_day_mode: 'day' })
              }
            />
            <Text className='font-ibm-semibold text-base text-neutral-700 mt-4 mb-2.5 ml-1'>
              영업일 보정
            </Text>
            <View className='flex-row gap-2'>
              {[
                { key: 'none', label: '없음' },
                { key: 'prev', label: '직전' },
                { key: 'next', label: '직후' },
              ].map(opt => {
                const isSelected = form.business_day_adjust === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() =>
                      onChange({
                        ...form,
                        business_day_adjust: opt.key as
                          | 'none'
                          | 'prev'
                          | 'next',
                      })
                    }
                    className={`rounded-xl px-3.5 h-10 items-center justify-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`${isSelected ? 'font-ibm-bold text-neutral-700' : 'font-ibm-semibold text-neutral-500'} text-sm`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View
          className='px-6 pb-6 pt-3 gap-3'
          style={{ borderTopWidth: 1, borderTopColor: Colors.cream }}
        >
          {editingId && onDelete && (
            <DeleteButton onPress={onDelete} label='고정지출 삭제' />
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
