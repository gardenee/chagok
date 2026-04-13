import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Keyboard } from 'react-native';
import { Clipboard, Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import { Colors } from '@/constants/colors';

type Props = {
  value: string;
  onChange: (newValue: string) => void;
  maxLength?: number;
};

type KeyValue =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '00'
  | '0'
  | '⌫';

const ROWS: KeyValue[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', '⌫'],
];

export function NumericKeypad({ value, onChange, maxLength = 10 }: Props) {
  const [clipboardValue, setClipboardValue] = useState('');

  useEffect(() => {
    Keyboard.dismiss();
    (async () => {
      try {
        const text = await ExpoClipboard.getStringAsync();
        const digits = text.replace(/[^0-9]/g, '');
        const num = parseInt(digits, 10);
        if (digits.length > 0 && num > 0) {
          setClipboardValue(digits.slice(0, maxLength));
        } else {
          setClipboardValue('');
        }
      } catch {
        setClipboardValue('');
      }
    })();
  }, [maxLength]);

  function handleKey(key: KeyValue) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }

    if (value === '' && (key === '0' || key === '00')) return;

    const next = value + key;
    if (next.length > maxLength) return;

    onChange(next);
  }

  function handlePaste() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(clipboardValue);
  }

  return (
    <View
      className='bg-neutral-100'
      style={{
        paddingBottom: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#D4D4D4',
          }}
        />
      </View>
      {clipboardValue !== '' && (
        <TouchableOpacity
          onPress={handlePaste}
          className='mx-3 mb-2 bg-butter rounded-2xl flex-row items-center justify-center gap-2'
          style={{ paddingVertical: 10 }}
          activeOpacity={0.8}
        >
          <Clipboard size={14} color={Colors.brownDarker} strokeWidth={2} />
          <Text className='font-ibm-semibold text-sm text-brown-darker'>
            {parseInt(clipboardValue, 10).toLocaleString('ko-KR')}원 붙여넣기
          </Text>
        </TouchableOpacity>
      )}

      <View className='px-3 gap-2'>
        {ROWS.map((row, rowIndex) => (
          <View key={rowIndex} className='flex-row gap-2'>
            {row.map(key => (
              <KeyButton
                key={key}
                keyValue={key}
                onPress={() => handleKey(key)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function KeyButton({
  keyValue,
  onPress,
}: {
  keyValue: KeyValue;
  onPress: () => void;
}) {
  const isBackspace = keyValue === '⌫';

  return (
    <TouchableOpacity
      onPress={onPress}
      className='flex-1 h-14 rounded-2xl items-center justify-center'
      style={{
        backgroundColor: isBackspace ? '#EDE8E0' : 'white',
        borderTopWidth: isBackspace ? 0 : 2,
        borderTopColor: isBackspace
          ? 'transparent'
          : 'rgba(255, 255, 255, 0.8)',
        shadowColor: Colors.brown,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      activeOpacity={0.65}
    >
      {isBackspace ? (
        <Delete size={22} color={Colors.brown} strokeWidth={2} />
      ) : (
        <Text className='font-ibm-semibold text-xl text-brown-darker'>
          {keyValue}
        </Text>
      )}
    </TouchableOpacity>
  );
}
