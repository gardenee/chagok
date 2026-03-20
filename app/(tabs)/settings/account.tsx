import {
  View,
  Text,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut, DoorOpen, UserX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useLeaveCouple, useDeleteAccount } from '@/hooks/use-user';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { SettingsRow } from '@/components/settings/settings-row';

export default function AccountScreen() {
  const router = useRouter();
  const { userProfile } = useAuthStore();
  const leaveCoupleAction = useLeaveCouple();
  const deleteAccountAction = useDeleteAccount();

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  function handleLeaveCouple() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      '가계부 나가기',
      '가계부를 나가면 짝꿍과의 연동이 해제됩니다.\n짝꿍의 데이터는 유지됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCoupleAction.mutateAsync();
            } catch {
              Alert.alert('오류', '가계부 나가기 중 문제가 발생했어요');
            }
          },
        },
      ],
    );
  }

  function handleDeleteAccount() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.\n정말 탈퇴할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccountAction.mutateAsync();
            } catch {
              Alert.alert('오류', '회원 탈퇴 중 문제가 발생했어요');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='px-6 pt-6 pb-4 flex-row items-center'>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className='-ml-1 mr-1'
        >
          <ChevronLeft size={28} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className='font-ibm-bold text-2xl text-brown-darker'>
          계정 관리
        </Text>
      </View>

      <View className='px-0 mt-2'>
        <SettingsCard>
          <SettingsRow
            icon={
              <LogOut size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label='로그아웃'
            onPress={handleLogout}
          />
          {userProfile?.couple_id && (
            <>
              <Divider />
              <SettingsRow
                icon={
                  <DoorOpen
                    size={16}
                    color={Colors.neutralDarker}
                    strokeWidth={2}
                  />
                }
                label='가계부 나가기'
                onPress={handleLeaveCouple}
                disabled={leaveCoupleAction.isPending}
              />
            </>
          )}
          <Divider />
          <SettingsRow
            icon={
              <UserX size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label='회원 탈퇴'
            onPress={handleDeleteAccount}
            disabled={deleteAccountAction.isPending}
          />
        </SettingsCard>
      </View>
    </SafeAreaView>
  );
}
