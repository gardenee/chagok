import { View, Text, Alert } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { useCreateUserProfile } from '../../hooks/use-user';
import { ClayButton } from '../../components/ui/clay-button';
import { ClayInput } from '../../components/ui/clay-input';
import { FadeInButton } from '../../components/ui/fade-in-button';

const VALID_PATTERN = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z]*$/;

export default function NicknameScreen() {
  const [nickname, setNickname] = useState('');
  const { session, setUserProfile } = useAuthStore();
  const { mutateAsync: createUserProfile, isPending } = useCreateUserProfile();

  const hasInput = nickname.trim().length > 0;

  function handleChangeText(text: string) {
    const filtered = text
      .split('')
      .filter(ch => VALID_PATTERN.test(ch))
      .join('');
    setNickname(filtered);
  }

  async function handleComplete() {
    const trimmed = nickname.trim();
    if (!session) return;
    try {
      const profile = await createUserProfile({
        userId: session.user.id,
        nickname: trimmed,
      });
      setUserProfile(profile);
    } catch {
      Alert.alert('오류', '별명 저장에 실패했습니다. 다시 시도해 주세요.');
    }
  }

  return (
    <View className='flex-1 bg-cream px-8'>
      <View className='pt-32'>
        <Text className='font-ibm-bold text-[40px] text-neutral-700 tracking-tight leading-[52px]'>
          이름을 알려주세요
        </Text>
        <Text className='font-ibm-regular text-base text-neutral-500 mt-2'>
          짝꿍에게 표시되는 이름이에요
        </Text>
        <View className='mt-8'>
          <ClayInput
            placeholder='예: 꿀꿀이'
            value={nickname}
            onChangeText={handleChangeText}
            maxLength={5}
            showCounter
            autoFocus
            returnKeyType='done'
            onSubmitEditing={hasInput ? handleComplete : undefined}
          />
        </View>
      </View>

      <View className='flex-1' />

      <View className='justify-end pb-10 h-24'>
        <FadeInButton visible={hasInput}>
          <ClayButton
            label='다음'
            onPress={handleComplete}
            loading={isPending}
            size='md'
          />
        </FadeInButton>
      </View>
    </View>
  );
}
