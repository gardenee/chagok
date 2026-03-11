import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { useState } from 'react';
import {
  BookOpen,
  Hash,
  User,
  Bell,
  LogOut,
  Users,
  Link,
  X,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { useNotificationSettingsStore } from '@/store/notification-settings';
import { supabase } from '@/lib/supabase';
import { useCouple, useUpdateBookName } from '@/hooks/use-couple';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useUpdateNickname } from '@/hooks/use-user';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { EditModal } from '@/components/settings/edit-modal';

export default function SettingsScreen() {
  const { userProfile } = useAuthStore();
  const { data: couple, isLoading: coupleLoading } = useCouple();
  const { data: members = [] } = useCoupleMembers();
  const updateBookName = useUpdateBookName();
  const updateNickname = useUpdateNickname();
  const {
    partnerTransaction,
    comment,
    fixedExpenseReminder,
    setPartnerTransaction,
    setComment,
    setFixedExpenseReminder,
  } = useNotificationSettingsStore();

  const [editModal, setEditModal] = useState<{
    type: 'bookName' | 'nickname' | null;
  }>({ type: null });
  const [notifInboxVisible, setNotifInboxVisible] = useState(false);
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className='px-6 pt-6 pb-4 flex-row items-center justify-between'>
          <Text className='font-ibm-bold text-2xl text-brown-darker'>설정</Text>
          <TouchableOpacity
            onPress={() => setNotifInboxVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={22} color={Colors.brown} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <SettingsCard>
          <SettingsRow
            icon={<User size={16} color='#737373' strokeWidth={2} />}
            label='닉네임'
            value={userProfile?.nickname ?? '-'}
            onPress={() => openEdit('nickname')}
          />
        </SettingsCard>

        <View className='mt-3'>
          <SettingsCard>
            <SettingsRow
              icon={<BookOpen size={16} color='#737373' strokeWidth={2} />}
              label='가계부 이름'
              value={coupleLoading ? '...' : (couple?.book_name ?? '-')}
              onPress={() => openEdit('bookName')}
            />
            <Divider />
            {isLinked ? (
              <>
                <SettingsRow
                  icon={<Users size={16} color='#737373' strokeWidth={2} />}
                  label='짝꿍'
                  value={partner?.nickname ?? '-'}
                  showChevron={false}
                />
                <Divider />
                <SettingsRow
                  icon={<Hash size={16} color='#737373' strokeWidth={2} />}
                  label='초대코드'
                  value=''
                  showChevron={false}
                  rightElement={
                    <View className='flex-row items-center gap-1 bg-butter rounded-full px-2.5 py-1'>
                      <Link size={11} color={Colors.brown} strokeWidth={2.5} />
                      <Text className='font-ibm-semibold text-xs text-brown-dark'>
                        연동 완료
                      </Text>
                    </View>
                  }
                />
              </>
            ) : (
              <>
                <SettingsRow
                  icon={<Hash size={16} color='#737373' strokeWidth={2} />}
                  label='초대코드'
                  value={coupleLoading ? '...' : (couple?.invite_code ?? '-')}
                  onPress={handleShareInviteCode}
                />
                <Divider />
                <SettingsRow
                  icon={<Users size={16} color='#737373' strokeWidth={2} />}
                  label='짝꿍'
                  value='아직 연동 전'
                  showChevron={false}
                />
              </>
            )}
          </SettingsCard>
        </View>

        <View className='mt-3'>
          <SettingsCard>
            {[
              {
                label: '짝꿍 지출 알림',
                value: partnerTransaction,
                onToggle: (v: boolean) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPartnerTransaction(v);
                },
              },
              {
                label: '댓글 알림',
                value: comment,
                onToggle: (v: boolean) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setComment(v);
                },
              },
              {
                label: '고정지출 리마인더',
                value: fixedExpenseReminder,
                onToggle: (v: boolean) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFixedExpenseReminder(v);
                },
              },
            ].map((item, i) => (
              <View key={item.label}>
                {i > 0 && <Divider />}
                <View className='flex-row items-center px-4 py-4 bg-cream'>
                  <View className='w-8 h-8 rounded-xl bg-cream-dark/70 items-center justify-center mr-3'>
                    <Bell
                      size={16}
                      color={item.value ? Colors.brown : '#A3A3A3'}
                      strokeWidth={2}
                    />
                  </View>
                  <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                    {item.label}
                  </Text>
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#E5E5E5', true: Colors.butter }}
                    thumbColor='#fff'
                  />
                </View>
              </View>
            ))}
          </SettingsCard>
        </View>

        <View className='mt-3'>
          <SettingsCard>
            <SettingsRow
              icon={<LogOut size={16} color='#737373' strokeWidth={2} />}
              label='로그아웃'
              onPress={handleLogout}
            />
          </SettingsCard>
        </View>

        <Text className='font-ibm-regular text-xs text-neutral-400 text-center mt-6'>
          버전 {appVersion}
        </Text>
      </ScrollView>

      <Modal
        visible={notifInboxVisible}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setNotifInboxVisible(false)}
      >
        <SafeAreaView className='flex-1 bg-cream'>
          <View className='flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-cream-dark'>
            <Text className='font-ibm-bold text-xl text-brown-darker'>
              알림
            </Text>
            <TouchableOpacity
              onPress={() => setNotifInboxVisible(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color='#A3A3A3' strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View className='flex-1 items-center justify-center gap-2'>
            <Bell size={36} color='#D4D4D4' strokeWidth={1.5} />
            <Text className='font-ibm-semibold text-sm text-neutral-400'>
              아직 알림이 없어요
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

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
