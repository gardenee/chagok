import { View, Text, Alert, Share } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Share2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { ClayButton } from '../../components/ui/clay-button';
import { ClayInput } from '../../components/ui/clay-input';
import { useCreateCouple } from '../../hooks/use-couple';
import { useGetUserProfile } from '../../hooks/use-user';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type Step = 'name' | 'invite';

export default function CreateCoupleScreen() {
  const [step, setStep] = useState<Step>('name');
  const [bookName, setBookName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { session, setUserProfile } = useAuthStore();

  const { mutateAsync: createCouple, isPending } = useCreateCouple();
  const { mutateAsync: getUserProfile } = useGetUserProfile();

  async function handleCreate() {
    const trimmed = bookName.trim();
    if (!trimmed) {
      Alert.alert('알림', '가계부 이름을 입력해 주세요.');
      return;
    }

    try {
      const code = generateInviteCode();
      await createCouple({ bookName: trimmed, inviteCode: code });

      const profile = await getUserProfile(session!.user.id);
      setUserProfile(profile);
      setInviteCode(code);
      setStep('invite');
    } catch {
      Alert.alert('오류', '가계부 생성에 실패했습니다. 다시 시도해 주세요.');
    }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    const deepLink = `chagok://join?code=${inviteCode}`;
    await Share.share({
      message: `차곡 앱에서 같이 가계부를 써요!\n\n초대 코드: ${inviteCode}\n\n앱 설치 후 링크를 탭하거나 코드를 입력하세요:\n${deepLink}`,
    });
  }

  if (step === 'invite') {
    return (
      <View className="flex-1 bg-cream px-8">
        <View className="flex-1" />

        <View className="mb-10">
          <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
            초대코드를{'\n'}파트너에게 보내요
          </Text>
          <Text className="font-ibm-regular text-base text-brown/60 mt-2">
            파트너가 코드를 입력하면 연동 완료!
          </Text>
        </View>

        <View
          className="bg-butter rounded-[24px] py-8 items-center mb-6"
          style={Shadows.card}
        >
          <Text className="font-ibm-regular text-sm text-brown/60 mb-2">초대 코드</Text>
          <Text className="font-ibm-bold text-[44px] text-brown tracking-widest">
            {inviteCode}
          </Text>
        </View>

        <View className="gap-3 mb-6">
          <ClayButton
            label="공유하기"
            onPress={handleShare}
            icon={<Share2 size={20} color={Colors.brown} strokeWidth={2.5} />}
          />
          <ClayButton
            label={copied ? '복사됨!' : '코드 복사'}
            onPress={handleCopy}
            variant="secondary"
            icon={
              copied
                ? <Check size={20} color={Colors.brown} strokeWidth={2.5} />
                : <Copy size={20} color={Colors.brown} strokeWidth={2.5} />
            }
          />
        </View>

        <Text className="font-ibm-regular text-sm text-brown/40 text-center mb-4">
          파트너가 합류하면 자동으로 시작돼요
        </Text>

        <View className="flex-1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream px-8">
      <View className="flex-1" />

      <View className="mb-10">
        <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
          가계부 이름을{'\n'}정해요
        </Text>
        <Text className="font-ibm-regular text-base text-brown/60 mt-2">
          나중에 바꿀 수 있어요
        </Text>
      </View>

      <View className="mb-8">
        <ClayInput
          placeholder="예: 우리 둘의 살림"
          value={bookName}
          onChangeText={setBookName}
          maxLength={20}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
      </View>

      <ClayButton
        label="만들기"
        onPress={handleCreate}
        loading={isPending}
        disabled={!bookName.trim()}
      />

      <View className="flex-1" />
    </View>
  );
}
