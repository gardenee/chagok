import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { ICON_MAP } from '@/constants/icon-map';
import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
import type { Category } from '@/types/database';

export type FormData = {
  name: string;
  amount: string;
  due_day: number;
  category_id: string | null;
};

export const INITIAL_FORM: FormData = {
  name: '',
  amount: '',
  due_day: 1,
  category_id: null,
};

type Props = {
  visible: boolean;
  editingId: string | null;
  form: FormData;
  isSaving: boolean;
  categories: Category[];
  onChange: (form: FormData) => void;
  onClose: () => void;
  onSave: () => void;
};

export function FixedExpenseForm({
  visible,
  editingId,
  form,
  isSaving,
  categories,
  onChange,
  onClose,
  onSave,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheetHeader
        title={editingId ? '고정지출 수정' : '고정지출 추가'}
        onClose={onClose}
        className='mb-6'
      />

      <ModalTextInput
        value={form.name}
        onChangeText={v => onChange({ ...form, name: v })}
        placeholder='항목 이름 (예: 월세, 넷플릭스)'
        maxLength={20}
        autoFocus={!editingId}
        className='mb-4'
      />

      <AmountInput
        value={form.amount}
        onChangeText={v => onChange({ ...form, amount: v })}
        className='mb-4'
      />

      {/* 카테고리 선택 */}
      {categories.length > 0 && (
        <View className='mb-4'>
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            카테고리
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            <View className='flex-row gap-2 pr-2'>
              <TouchableOpacity
                onPress={() => onChange({ ...form, category_id: null })}
                className={`items-center gap-1`}
                activeOpacity={0.7}
              >
                <View
                  className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100'
                  style={{
                    borderWidth: form.category_id === null ? 2 : 0,
                    borderColor: Colors.brown,
                  }}
                >
                  <Wallet size={20} color='#A3A3A3' strokeWidth={2.5} />
                </View>
                <Text className='font-ibm-semibold text-[10px] text-neutral-500'>
                  없음
                </Text>
              </TouchableOpacity>
              {categories.map(c => {
                const Icon = ICON_MAP[c.icon] ?? Wallet;
                const isSelected = form.category_id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      onChange({
                        ...form,
                        category_id: isSelected ? null : c.id,
                      });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className='items-center gap-1'
                    activeOpacity={0.7}
                  >
                    <View
                      className='w-12 h-12 rounded-2xl items-center justify-center'
                      style={{
                        backgroundColor: c.color + '30',
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? c.color : 'transparent',
                      }}
                    >
                      <Icon size={20} color={c.color} strokeWidth={2.5} />
                    </View>
                    <Text
                      className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 납부일 */}
      <View className='mb-6'>
        <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
          납부일
        </Text>
        <View className='flex-row flex-wrap gap-1.5'>
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
            const isSelected = form.due_day === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => onChange({ ...form, due_day: day })}
                className={`rounded-xl items-center justify-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                style={{ width: 38, height: 36 }}
                activeOpacity={0.7}
              >
                <Text
                  className={`${isSelected ? 'font-ibm-bold' : 'font-ibm-semibold'} text-xs ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}
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
        label={editingId ? '수정 완료' : '저장'}
      />
    </BottomSheet>
  );
}
