import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/constants/colors';

export const EOM_VALUE = 32;

const ITEMS = [
  ...Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}일`,
  })),
  { value: EOM_VALUE, label: '말일' },
];

type Props = {
  visible: boolean;
  selected: number; // 1–31 = 특정 일, EOM_VALUE = 말일
  onConfirm: (value: number) => void;
  onDismiss: () => void;
};

export function DueDayPickerModal({
  visible,
  selected,
  onConfirm,
  onDismiss,
}: Props) {
  const [pending, setPending] = useState(selected);

  useEffect(() => {
    if (visible) setPending(selected);
  }, [visible, selected]);

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
        <View className='bg-white rounded-t-3xl pt-5 pb-8'>
          <Text className='font-ibm-bold text-xl text-brown-darker text-center mb-2 px-6'>
            결제일 선택
          </Text>
          <Picker
            selectedValue={pending}
            onValueChange={value => setPending(value as number)}
            style={{ marginHorizontal: 16 }}
            itemStyle={{
              fontFamily: 'IBMPlexSansKR-Regular',
              fontSize: 20,
              color: Colors.brownDarker,
            }}
          >
            {ITEMS.map(item => (
              <Picker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
          <TouchableOpacity
            onPress={() => onConfirm(pending)}
            className='bg-butter rounded-2xl py-4 items-center mx-6'
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
