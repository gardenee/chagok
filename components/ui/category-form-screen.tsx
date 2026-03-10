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
  X,
  Check,
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
  Bot,
  BottleWine,
  Briefcase,
  BusFront,
  Cake,
  Candy,
  ChartCandlestick,
  Joystick,
  Landmark,
  Banknote,
  Laptop,
  TrendingUp,
  Coins,
  Building2,
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
  bot: Bot,
  wine: BottleWine,
  work: Briefcase,
  bus: BusFront,
  cake: Cake,
  candy: Candy,
  invest: ChartCandlestick,
  game: Joystick,
  bank: Landmark,
  salary: Banknote,
  freelance: Laptop,
  dividend: TrendingUp,
  allowance: Coins,
  rental: Building2,
};

export const COLOR_OPTIONS = [
  // 핑크/피치/레드
  '#FFCCD5', // baby pink
  '#F0C5D5', // pink
  '#F7B8A0', // peach
  '#FFD4B8', // light peach
  '#F4A0A0', // coral
  '#E8A0C0', // rose
  // 보라/라벤더
  '#EAD8FC', // lilac
  '#D4C5F0', // lavender
  '#C5A8E8', // violet
  '#C8B8F0', // purple light
  // 블루
  '#C8D8F8', // periwinkle
  '#B5C8E8', // sky blue
  '#A0D8E8', // cyan
  '#B8E0F0', // light blue
  // 그린/민트
  '#A8D8B0', // mint
  '#B8E8C8', // light mint
  '#C5E8D5', // sage
  '#D0E8B5', // lime
  // 옐로/버터
  '#FAD97A', // butter
  '#FFE8A0', // pale yellow
  '#F5D0A0', // apricot
  '#F5C070', // amber
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
  mode?: 'budget' | 'category';
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
  mode = 'category',
  categoryType = 'expense',
  onTypeChange,
}: Props) {
  const isBudgetMode = mode === 'budget';
  const isIncome = categoryType === 'income';
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
            <Text className='font-ibm-bold text-lg text-neutral-800'>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color='#A3A3A3' strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* 타입 토글 — 추가 모드에만 표시 */}
          {!editingId && (
            <View
              className='flex-row rounded-2xl p-1 mb-6'
              style={{ backgroundColor: Colors.butter }}
            >
              {(['expense', 'income'] as const).map(type => {
                const isActive = categoryType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => onTypeChange?.(type)}
                    activeOpacity={0.8}
                    className='flex-1 rounded-xl py-2 items-center'
                    style={isActive ? { backgroundColor: '#fff' } : undefined}
                  >
                    <Text
                      className='font-ibm-semibold text-sm'
                      style={{
                        color: isActive ? Colors.brownDarker : Colors.brown,
                      }}
                    >
                      {type === 'expense' ? '지출' : '수입'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 이름 */}
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            카테고리명
          </Text>
          <ModalTextInput
            value={form.name}
            onChangeText={v => onChange({ ...form, name: v })}
            placeholder='카테고리 이름 (예: 식비, 교통비)'
            maxLength={10}
            className='mb-6'
          />

          {/* 예산 (budget 모드) */}
          {isBudgetMode && (
            <>
              <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                {isIncome ? '목표 수입 (선택)' : '월 예산'}
              </Text>
              <AmountInput
                value={form.budget_amount}
                onChangeText={v => onChange({ ...form, budget_amount: v })}
                placeholder={
                  isIncome ? '목표 수입 금액 (선택)' : '예산 금액을 입력하세요'
                }
                className='mb-6'
              />
            </>
          )}

          {/* 아이콘 */}
          <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
            아이콘
          </Text>
          <View className='flex-row flex-wrap gap-2 mb-6'>
            {Object.entries(ICON_MAP).map(([key, Icon]) => {
              const isSelected = form.icon === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => onChange({ ...form, icon: key })}
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
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
        </ScrollView>

        {/* 하단 버튼 영역 */}
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
                카테고리 삭제
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
