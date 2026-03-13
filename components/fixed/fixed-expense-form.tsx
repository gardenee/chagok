import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { resolveColor } from '@/constants/color-map';
import { ICON_MAP } from '@/constants/icon-map';
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
  editingId: string | null;
  form: FormData;
  isSaving: boolean;
  categories: Category[];
  onChange: (form: FormData) => void;
  onClose: () => void;
  onSave: () => void;
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
  onCatCreate,
  onCatMgmt,
}: Props) {
  return (
    <SafeAreaView className='flex-1 bg-white'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-6 pt-5 mb-6'>
          <View style={{ width: 22 }} />
          <Text className='font-ibm-bold text-lg text-neutral-800'>
            {editingId ? '고정지출 수정' : '고정지출 추가'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color='#A3A3A3' strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps='handled'
        >
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
          <View className='mb-4'>
            <View className='flex-row items-center justify-between mb-2 ml-1 mr-1'>
              <Text className='font-ibm-semibold text-xs text-neutral-600'>
                카테고리
              </Text>
              {categories.length > 0 && (
                <TouchableOpacity
                  onPress={onCatMgmt}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className='font-ibm-semibold text-xs text-neutral-600 bg-neutral-200 rounded-2xl px-2 py-0.5'>
                    수정
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            >
              <View className='flex-row gap-2 pr-2'>
                {categories.map(c => {
                  const Icon = ICON_MAP[c.icon] ?? Wallet;
                  const isSelected = form.category_id === c.id;
                  const cColor = resolveColor(c.color);
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
                          backgroundColor: cColor + '30',
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: isSelected ? cColor : 'transparent',
                        }}
                      >
                        <Icon size={20} color={cColor} strokeWidth={2.5} />
                      </View>
                      <Text
                        className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={onCatCreate}
                  className='items-center gap-1'
                  activeOpacity={0.7}
                >
                  <View className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100 border border-dashed border-neutral-300'>
                    <Plus size={18} color='#A3A3A3' strokeWidth={2} />
                  </View>
                  <Text className='font-ibm-semibold text-[10px] text-neutral-600'>
                    추가
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

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
        </ScrollView>

        <View
          className='px-6 pb-6 pt-3'
          style={{ borderTopWidth: 1, borderTopColor: Colors.cream }}
        >
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
