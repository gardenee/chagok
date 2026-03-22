import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';

type DatePickerModalProps = {
  visible: boolean;
  mode: 'date' | 'time';
  dateStr?: string; // "YYYY-MM-DD" — date 모드에서 초기값
  timeStr?: string; // "HH:MM" — time 모드에서 초기값, 미제공 시 "09:00"
  onConfirm: (value: string) => void;
  onDismiss: () => void;
};

export function DatePickerModal({
  visible,
  mode,
  dateStr,
  timeStr,
  onConfirm,
  onDismiss,
}: DatePickerModalProps) {
  const [tempValue, setTempValue] = useState<Date>(new Date());

  useEffect(() => {
    if (!visible) return;
    if (mode === 'date' && dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      setTempValue(new Date(y, m - 1, d));
    } else if (mode === 'time') {
      const t = timeStr ?? '09:00';
      const [h, min] = t.split(':').map(Number);
      const d = new Date();
      d.setHours(h, min, 0, 0);
      setTempValue(d);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    if (mode === 'date') {
      const y = tempValue.getFullYear();
      const m = String(tempValue.getMonth() + 1).padStart(2, '0');
      const d = String(tempValue.getDate()).padStart(2, '0');
      onConfirm(`${y}-${m}-${d}`);
    } else {
      const h = String(tempValue.getHours()).padStart(2, '0');
      const min = String(tempValue.getMinutes()).padStart(2, '0');
      onConfirm(`${h}:${min}`);
    }
  }

  const title = mode === 'date' ? '날짜 선택' : '시간 선택';

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onDismiss}
    >
      <View
        className='flex-1 justify-end'
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        <TouchableOpacity
          className='flex-1'
          activeOpacity={1}
          onPress={onDismiss}
        />
        <View className='bg-white rounded-t-3xl px-6 pt-5 pb-8'>
          <Text className='font-ibm-bold text-xl text-brown-darker text-center mb-4'>
            {title}
          </Text>
          <View className='items-center mb-6'>
            <DateTimePicker
              value={tempValue}
              mode={mode}
              display='spinner'
              onChange={(_event, date) => {
                if (!date) return;
                setTempValue(date);
              }}
              locale='ko-KR'
              accentColor={Colors.brownDark}
            />
          </View>
          <TouchableOpacity
            onPress={handleConfirm}
            className='bg-butter rounded-2xl py-4 items-center'
            activeOpacity={0.8}
          >
            <Text className='font-ibm-bold text-base text-brown-darker'>
              확인
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
