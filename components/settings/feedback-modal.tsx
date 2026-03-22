import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Wrench, Lightbulb, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
import { SaveButton } from '@/components/ui/save-button';
import { useSubmitFeedback } from '@/hooks/use-feedback';
import type { FeedbackType } from '@/types/database';

type FeedbackTypeOption = {
  value: FeedbackType;
  label: string;
  icon: React.ReactNode;
};

const MAX_LENGTH = 300;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function FeedbackModal({ visible, onClose }: Props) {
  const [type, setType] = useState<FeedbackType>('improvement');
  const [content, setContent] = useState('');
  const submitFeedback = useSubmitFeedback();

  useEffect(() => {
    if (visible) {
      setType('improvement');
      setContent('');
    }
  }, [visible]);

  const options: FeedbackTypeOption[] = [
    {
      value: 'improvement',
      label: '개선 요청',
      icon: (
        <Wrench
          size={14}
          color={type === 'improvement' ? Colors.brownDarker : Colors.neutral}
          strokeWidth={2}
        />
      ),
    },
    {
      value: 'feature',
      label: '기능 추가',
      icon: (
        <Lightbulb
          size={14}
          color={type === 'feature' ? Colors.brownDarker : Colors.neutral}
          strokeWidth={2}
        />
      ),
    },
    {
      value: 'cheer',
      label: '응원해요',
      icon: (
        <Heart
          size={14}
          color={type === 'cheer' ? Colors.brownDarker : Colors.neutral}
          strokeWidth={2}
        />
      ),
    },
  ];

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await submitFeedback.mutateAsync({ type, content: trimmed });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      Alert.alert('전달됐어요', '소중한 의견 감사해요!');
    } catch {
      Alert.alert('오류', '전송 중 문제가 발생했어요');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheetHeader
        title='개발자에게 전하기'
        onClose={onClose}
        className='mb-5'
      />

      <View className='flex-row gap-2 mb-5'>
        {options.map(opt => {
          const selected = type === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setType(opt.value);
              }}
              activeOpacity={0.8}
              className='flex-row items-center gap-1.5 px-3 py-2 rounded-full'
              style={{
                backgroundColor: selected ? Colors.butter : Colors.cream,
              }}
            >
              {opt.icon}
              <Text
                className={`font-ibm-semibold text-sm ${selected ? 'text-neutral-800' : 'text-neutral-700'}`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className='bg-neutral-100 rounded-2xl px-4 py-3 mb-1'>
        <TextInput
          className='font-ibm-regular text-base text-neutral-800'
          placeholder='내용을 입력해주세요'
          placeholderTextColor={Colors.neutralLighter}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={5}
          maxLength={MAX_LENGTH}
          textAlignVertical='top'
          style={{ minHeight: 120 }}
        />
      </View>
      <Text className='font-ibm-regular text-sm text-neutral-400 text-right mb-4 mr-1'>
        {content.length}/{MAX_LENGTH}
      </Text>

      <SaveButton
        label='전송'
        onPress={handleSubmit}
        isSaving={submitFeedback.isPending}
        disabled={!content.trim()}
      />
    </BottomSheet>
  );
}
