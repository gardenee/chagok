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
  ChevronLeft,
  Check,
  Trash2,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Heart,
  BookOpen,
  Coffee,
  Plane,
  Shirt,
  Zap,
  Gift,
  Wallet,
  Dumbbell,
  Music,
  Baby,
  Scissors,
  PawPrint,
  Smartphone,
  type LucideIcon,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { SaveButton } from './save-button';
import { ModalTextInput, AmountInput } from './modal-inputs';

export const ICON_MAP: Record<string, LucideIcon> = {
  shopping: ShoppingCart,
  food: Utensils,
  transport: Car,
  home: Home,
  health: Heart,
  education: BookOpen,
  cafe: Coffee,
  travel: Plane,
  fashion: Shirt,
  telecom: Zap,
  gift: Gift,
  wallet: Wallet,
  fitness: Dumbbell,
  music: Music,
  baby: Baby,
  beauty: Scissors,
  pet: PawPrint,
  digital: Smartphone,
};

export const COLOR_OPTIONS = [
  '#F7B8A0',
  '#D4C5F0',
  '#FAD97A',
  '#A8D8B0',
  '#F0C5D5',
  '#B5D5F0',
  '#F5D0A0',
  '#C5E8D5',
  '#E0B5D5',
  '#B5C8E8',
  '#E8D8B0',
  '#D0E8B5',
];

export type CategoryFormData = {
  name: string;
  icon: string;
  color: string;
  budget_amount: string;
};

export const INITIAL_CATEGORY_FORM: CategoryFormData = {
  name: '',
  icon: 'shopping',
  color: COLOR_OPTIONS[0],
  budget_amount: '',
};

type Props = {
  editingId: string | null;
  form: CategoryFormData;
  isSaving: boolean;
  onBack: () => void;
  onChange: (form: CategoryFormData) => void;
  onSave: () => void;
  onDelete?: () => void;
};

export function CategoryFormScreen({
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
              {editingId ? '카테고리 수정' : '카테고리 추가'}
            </Text>
            {editingId && onDelete ? (
              <TouchableOpacity
                onPress={onDelete}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={18} color={Colors.brown + '60'} strokeWidth={2} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 22 }} />
            )}
          </View>

          {/* 이름 */}
          <ModalTextInput
            value={form.name}
            onChangeText={v => onChange({ ...form, name: v })}
            placeholder='카테고리 이름 (예: 식비, 교통비)'
            maxLength={10}
            autoFocus
            className='mb-6'
          />

          {/* 아이콘 */}
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            아이콘
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className='mb-6'
            keyboardShouldPersistTaps='handled'
          >
            <View className='flex-row gap-2 pr-2'>
              {Object.entries(ICON_MAP).map(([key, Icon]) => {
                const isSelected = form.icon === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => onChange({ ...form, icon: key })}
                    className={`w-12 h-12 rounded-2xl items-center justify-center ${isSelected ? 'bg-butter' : 'bg-neutral-100'}`}
                    activeOpacity={0.7}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? Colors.brown : '#A3A3A3'}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* 색상 */}
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            색상
          </Text>
          <View className='flex-row flex-wrap gap-2 mb-6'>
            {COLOR_OPTIONS.map(color => {
              const isSelected = form.color === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => onChange({ ...form, color })}
                  className='w-9 h-9 rounded-full items-center justify-center'
                  style={{
                    backgroundColor: color,
                    borderWidth: isSelected ? 2.5 : 0,
                    borderColor: Colors.brown,
                  }}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Check size={14} color={Colors.brown} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 월 예산 */}
          <AmountInput
            value={form.budget_amount}
            onChangeText={v => onChange({ ...form, budget_amount: v })}
            placeholder='월 예산 금액'
            className='mb-2'
          />
        </ScrollView>

        {/* 저장 버튼 (하단 고정) */}
        <View className='px-6 pb-6 pt-3'>
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
