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
import { X, Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { COLOR_MAP } from '@/constants/color-map';
import { DeleteButton } from '@/components/ui/delete-button';
import { SaveButton } from '@/components/ui/save-button';
import { SegmentControl } from '@/components/ui/segment-control';
import { ModalTextInput } from '@/components/ui/modal-inputs';
import { ICON_MAP } from '@/constants/icon-map';

export const COLOR_OPTIONS = Object.keys(COLOR_MAP);

export type CategoryFormData = {
  name: string;
  icon: string;
  color: string;
};

export const INITIAL_CATEGORY_FORM: CategoryFormData = {
  name: '',
  icon: '',
  color: '',
};

type Props = {
  editingId: string | null;
  form: CategoryFormData;
  isSaving: boolean;
  onBack: () => void;
  onChange: (form: CategoryFormData) => void;
  onSave: () => void;
  onDelete?: () => void;
  categoryType?: 'expense' | 'income';
  onTypeChange?: (type: 'expense' | 'income') => void;
};

export function CategoryFormScreen({
  editingId,
  form,
  isSaving,
  onBack,
  onChange,
  onSave,
  onDelete,
  categoryType = 'expense',
  onTypeChange,
}: Props) {
  const [nameError, setNameError] = useState(false);
  const isIncome = categoryType === 'income';

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
  const title = editingId
    ? isIncome
      ? '수입 카테고리 수정'
      : '지출 카테고리 수정'
    : '카테고리 추가';

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
            <View style={{ width: 22 }} />
            <Text className='font-ibm-bold text-xl text-neutral-800'>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color={Colors.neutralLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* 타입 토글 — 추가 모드에만 표시 */}
          {!editingId && (
            <SegmentControl
              options={[
                { value: 'expense', label: '지출' },
                { value: 'income', label: '수입' },
              ]}
              value={categoryType ?? 'expense'}
              onChange={type => onTypeChange?.(type as 'expense' | 'income')}
              className='mb-6'
            />
          )}

          {/* 이름 */}
          <View className='mb-2 flex-row items-center ml-1'>
            <Text className='font-ibm-semibold text-base text-neutral-600'>
              카테고리명
            </Text>
            <Text
              className='font-ibm-semibold text-base ml-0.5'
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
            placeholder={categoryType === 'expense' ? '예: 식비, 교통비' : '예: 월급, 용돈'}
            maxLength={10}
            className='mb-6'
            error={nameError}
          />

          {/* 아이콘 */}
          <Text className='font-ibm-semibold text-base text-neutral-600 mb-2.5 ml-1'>
            아이콘
          </Text>
          <View className='flex-row flex-wrap gap-2 mb-6'>
            {Object.entries(ICON_MAP).map(([key, Icon]) => {
              const isSelected = form.icon === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => onChange({ ...form, icon: key })}
                  className={`w-[43px] h-[43px] rounded-2xl items-center justify-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={20}
                    color={isSelected ? Colors.brownDarker : '#A3A3A3'}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 색상 */}
          <Text className='font-ibm-semibold text-base text-neutral-600 mb-2.5 ml-1'>
            색상
          </Text>
          <View className='flex-row flex-wrap gap-2 mb-6'>
            {COLOR_OPTIONS.map(key => {
              const hex = COLOR_MAP[key];
              const isSelected = form.color === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => onChange({ ...form, color: key })}
                  className='w-9 h-9 rounded-full items-center justify-center'
                  style={{
                    backgroundColor: hex,
                    borderWidth: isSelected ? 2.5 : 0,
                    borderColor: Colors.brownDarker,
                  }}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Check
                      size={14}
                      color={Colors.brownDarker}
                      strokeWidth={3}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* 하단 버튼 영역 */}
        <View className='px-6 pb-6 pt-3 gap-3'>
          {editingId && onDelete && (
            <DeleteButton onPress={onDelete} label='카테고리 삭제' />
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
