import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { BottomSheet } from '../ui/bottom-sheet';

interface YearMonthPickerProps {
  visible: boolean;
  onClose: () => void;
  pickerYear: number;
  onPickerYearChange: (year: number) => void;
  currentYear: number;
  currentMonth: number;
  onSelectMonth: (year: number, month: number) => void;
  onGoToday: () => void;
}

export function YearMonthPicker({
  visible,
  onClose,
  pickerYear,
  onPickerYearChange,
  currentYear,
  currentMonth,
  onSelectMonth,
  onGoToday,
}: YearMonthPickerProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className='flex-row items-center justify-between mb-5'>
        <TouchableOpacity
          onPress={() => {
            onGoToday();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          className='px-3 py-1.5 rounded-xl bg-neutral-100'
          style={{ minWidth: 52 }}
          activeOpacity={0.7}
        >
          <Text className='font-ibm-semibold text-xs text-brown/70 text-center'>
            오늘
          </Text>
        </TouchableOpacity>

        <View className='flex-row items-center gap-3'>
          <TouchableOpacity
            onPress={() => onPickerYearChange(pickerYear - 1)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft
              size={22}
              color={Colors.brownDarker}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <Text className='font-ibm-bold text-xl text-brown-darker w-20 text-center'>
            {pickerYear}년
          </Text>
          <TouchableOpacity
            onPress={() => onPickerYearChange(pickerYear + 1)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronRight
              size={22}
              color={Colors.brownDarker}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ minWidth: 52, alignItems: 'flex-end' }}
        >
          <X size={22} color='#A3A3A3' strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View className='flex-row flex-wrap gap-2'>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
          const isSelected =
            pickerYear === currentYear && month === currentMonth + 1;
          return (
            <TouchableOpacity
              key={month}
              onPress={() => {
                onSelectMonth(pickerYear, month - 1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`rounded-2xl py-3 items-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
              style={{ width: '23%' }}
              activeOpacity={0.7}
            >
              <Text
                className={`font-ibm-semibold text-sm ${isSelected ? 'text-brown' : 'text-brown/50'}`}
              >
                {month}월
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}
