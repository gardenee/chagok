import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { useState, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import {
  BookOpen,
  Hash,
  User,
  Bell,
  LogOut,
  Users,
  Link,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { useCouple, useUpdateBookName } from '@/hooks/use-couple';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useUpdateNickname } from '@/hooks/use-user';
import {
  useUnreadCount,
  useNotificationsSubscription,
} from '@/hooks/use-notifications';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { EditModal } from '@/components/settings/edit-modal';
import { NotificationInbox } from '@/components/settings/notification-inbox';
import { NotificationSettings } from '@/components/settings/notification-settings';

export default function SettingsScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { userProfile } = useAuthStore();
  const { data: couple, isLoading: coupleLoading } = useCouple();
  const { data: members = [] } = useCoupleMembers();
  const updateBookName = useUpdateBookName();
  const updateNickname = useUpdateNickname();
  const [editModal, setEditModal] = useState<{
    type: 'bookName' | 'nickname' | null;
  }>({ type: null });
  const [notifInboxVisible, setNotifInboxVisible] = useState(false);
  const { unreadCount } = useUnreadCount();
  useNotificationsSubscription();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const partner = members.find(m => m.id !== userProfile?.id);
  const isLinked = !!partner;

  function openEdit(type: 'bookName' | 'nickname') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditModal({ type });
  }

  function closeEdit() {
    setEditModal({ type: null });
  }

  async function handleSaveBookName(value: string) {
    if (!value) return;
    try {
      await updateBookName.mutateAsync(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeEdit();
    } catch {
      Alert.alert('오류', '가계부 이름 변경 중 문제가 발생했어요');
    }
  }

  async function handleSaveNickname(value: string) {
    if (!value) return;
    try {
      await updateNickname.mutateAsync(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeEdit();
    } catch {
      Alert.alert('오류', '닉네임 변경 중 문제가 발생했어요');
    }
  }

  async function handleShareInviteCode() {
    if (!couple?.invite_code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `차곡 초대코드: ${couple.invite_code}\n앱에서 입력해서 함께 시작해요!`,
      });
    } catch {
      Alert.alert('오류', '공유하기 중 문제가 발생했어요');
    }
  }

  function handleLogout() {
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

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className='px-6 pt-6 pb-4 flex-row items-center justify-between'>
          <Text className='font-ibm-bold text-3xl text-brown-darker'>설정</Text>
          <TouchableOpacity
            onPress={() => setNotifInboxVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View className='relative'>
              <Bell size={22} color={Colors.brownDarker} strokeWidth={2} />
              {unreadCount > 0 && (
                <View className='absolute -top-1 -right-1 w-4 h-4 rounded-full bg-peach items-center justify-center'>
                  <Text className='font-ibm-bold text-[9px] text-brown'>
                    {unreadCount <= 9 ? String(unreadCount) : '9+'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <SettingsCard>
          <SettingsRow
            icon={
              <User size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label='닉네임'
            value={userProfile?.nickname ?? '-'}
            onPress={() => openEdit('nickname')}
          />
        </SettingsCard>

        <View className='mt-3'>
          <SettingsCard>
            <SettingsRow
              icon={
                <BookOpen
                  size={16}
                  color={Colors.brownDarker}
                  strokeWidth={2}
                />
              }
              label='가계부 이름'
              value={coupleLoading ? '...' : (couple?.book_name ?? '-')}
              onPress={() => openEdit('bookName')}
            />
            <Divider />
            {isLinked ? (
              <>
                <SettingsRow
                  icon={
                    <Users
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='짝꿍'
                  value={partner?.nickname ?? '-'}
                  showChevron={false}
                />
                <Divider />
                <SettingsRow
                  icon={
                    <Hash
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='초대코드'
                  value=''
                  showChevron={false}
                  rightElement={
                    <View className='flex-row items-center gap-1 bg-butter rounded-full px-2.5 py-1'>
                      <Link size={11} color={Colors.brown} strokeWidth={2.5} />
                      <Text className='font-ibm-semibold text-sm text-brown-dark'>
                        연동 완료
                      </Text>
                    </View>
                  }
                />
              </>
            ) : (
              <>
                <SettingsRow
                  icon={
                    <Hash
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='초대코드'
                  value={coupleLoading ? '...' : (couple?.invite_code ?? '-')}
                  onPress={handleShareInviteCode}
                />
                <Divider />
                <SettingsRow
                  icon={
                    <Users
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='짝꿍'
                  value='아직 연동 전'
                  showChevron={false}
                />
              </>
            )}
          </SettingsCard>
        </View>

        <View className='mt-3'>
          <NotificationSettings />
        </View>

        <View className='mt-3'>
          <SettingsCard>
            <SettingsRow
              icon={
                <LogOut
                  size={16}
                  color={Colors.neutralDarker}
                  strokeWidth={2}
                />
              }
              label='로그아웃'
              onPress={handleLogout}
            />
          </SettingsCard>
        </View>

        <Text className='font-ibm-regular text-sm text-neutral-600 text-center mt-6'>
          버전 {appVersion}
        </Text>
      </ScrollView>

      <NotificationInbox
        visible={notifInboxVisible}
        onClose={() => setNotifInboxVisible(false)}
      />

      <EditModal
        visible={editModal.type === 'nickname'}
        title='닉네임 변경'
        value={userProfile?.nickname ?? ''}
        placeholder='닉네임 입력'
        onClose={closeEdit}
        onSave={handleSaveNickname}
        isSaving={updateNickname.isPending}
      />

      <EditModal
        visible={editModal.type === 'bookName'}
        title='가계부 이름 변경'
        value={couple?.book_name ?? ''}
        placeholder='가계부 이름 입력'
        onClose={closeEdit}
        onSave={handleSaveBookName}
        isSaving={updateBookName.isPending}
      />
    </SafeAreaView>
  );
}
